import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useInsightsData,
  useInsightsFilters,
  useAppTheme,
  useHaptics,
  useSavedFilters,
  useToast,
} from '@/hooks';
import type { SavedFilter } from '@/hooks/useSavedFilters';
import { promptFilterName } from '@/utils';
import { useActivityContext } from '@/context';
import { DecorativeCircles, ScreenContainer, ScreenHeader } from '@/components/layout';
import {
  FiltersPill,
  QuickFilterChip,
  SearchableListPicker,
  SegmentedPills,
  ViewModeToggle,
} from '@/components/forms';
import type { SegmentOption } from '@/components/forms';
import type { SearchableOption } from '@/components/forms';
import { countryFlag } from '@/utils/countryFlag';
import { BarChartCard, ChartEmptyState, PieChartCard } from '@/components/charts';
import { StreakCard } from '@/components/cards';
import { EmptyState, Toast } from '@/components/feedback';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig, DrillDownPreset } from '@/components/modals';
import { InsightsDateRangePicker } from '@/components/insights';
import type { InsightsDateRangeValue } from '@/components/insights';
import { BorderRadius, Palette, SharedStyles, Spacing } from '@/constants';
import { computeStreaks } from '@/utils/streakCalculator';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { ReactNode } from 'react';
import type {
  InsightsContinent,
  InsightsCountry,
  InsightsDateRange,
  InsightsStatus,
  InsightsTripId,
} from '@/hooks';
import type { Category, ViewMode } from '@/types';

// LayoutAnimation on Android needs an explicit opt-in on older RN builds.
// Safe no-op once enabled; guards against double-enabling on fast refresh.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Namespace under which Insights-scoped filters are persisted. Keeps the
// shared SQLite `saved_filters` table partitioned from the Activities scope
// so each surface only lists its own presets.
const SCOPE = 'insights';

const STATUS_OPTIONS: ReadonlyArray<SegmentOption<InsightsStatus>> = [
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'Completed', value: 'completed' },
];

const DATE_RANGE_LABELS: Record<InsightsDateRange, string> = {
  all: 'All time',
  today: 'Today',
  week: 'Week',
  month: 'Month',
  custom: 'Custom',
};

/**
 * The Insights tab. Turns the user's activity history into charts they
 * can explore, with a search bar and a filter sheet for narrowing the
 * view by trip, category, date range, continent or country.
 */
export default function InsightsScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [sheetOpen, setSheetOpen] = useState(false);
  // Window offset for the bar chart: 0 = most recent window, -1 =
  // previous, etc. Reset whenever the view mode changes so the user
  // always lands on the most recent window for the new mode.
  const [chartOffset, setChartOffset] = useState(0);
  // Owned up here so taps elsewhere on the page (and scroll drags) can
  // dismiss the tooltip - the chart only renders what we tell it.
  const [barSelectedIndex, setBarSelectedIndex] = useState<number | null>(null);
  const dismissTooltip = useCallback(() => setBarSelectedIndex(null), []);
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { toast, showToast, hideToast } = useToast();
  const { savedFilters, saveFilter, removeFilter } = useSavedFilters();

  const {
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    status,
    setStatus,
    dateRange,
    setDateRange,
    customStartDate,
    customEndDate,
    setCustomDateRange,
    tripId,
    setTripId,
    continent,
    setContinent,
    country,
    setCountry,
    filteredActivities,
    activeFilterCount,
    isFiltered,
    clearAll,
    categories,
    trips,
    availableContinents,
    availableCountries,
  } = useInsightsFilters();

  const {
    barChartData,
    categoryPieData,
    rangeLabel: chartRangeLabel,
    canGoBack: canChartGoBack,
    canGoForward: canChartGoForward,
  } = useInsightsData(viewMode, filteredActivities, chartOffset);

  const totalMinutes = useMemo(
    () => filteredActivities.reduce((sum, a) => sum + a.metric, 0),
    [filteredActivities],
  );

  // Streak is computed off the FULL activity set, not the filtered one -
  // a "daily streak" is a calendar property of the user's logging habit,
  // not something a category/date filter should mask.
  const { activities: allActivities } = useActivityContext();
  const streak = useMemo(() => computeStreaks(allActivities), [allActivities]);


  // --- Option lists for the drill-down pickers ---
  const categoryOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All categories', value: 'all', icon: 'apps-outline' },
      ...categories.map((c: Category) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
        icon: c.icon as SearchableOption['icon'],
      })),
    ],
    [categories],
  );

  const tripOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All trips', value: 'all', icon: 'airplane-outline' },
      ...trips.map((t) => ({
        label: t.name,
        value: String(t.id),
        icon: 'airplane-outline' as SearchableOption['icon'],
      })),
    ],
    [trips],
  );

  const continentOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All continents', value: 'all', icon: 'globe-outline' },
      ...availableContinents.map((c) => ({
        label: c,
        value: c,
        icon: 'globe-outline' as SearchableOption['icon'],
      })),
    ],
    [availableContinents],
  );

  const countryOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All countries', value: 'all', icon: 'flag-outline' },
      ...availableCountries.map((c) => ({
        label: c,
        value: c,
        emoji: countryFlag(c),
      })),
    ],
    [availableCountries],
  );

  // --- Drill-down sheet filter config ---
  const categoryLabelFor = (v: string) =>
    v === 'all'
      ? 'All categories'
      : categories.find((c) => String(c.id) === v)?.name ?? 'All categories';
  const tripLabelFor = (v: string) =>
    v === 'all' ? 'All trips' : trips.find((t) => String(t.id) === v)?.name ?? 'All trips';
  const dateRangeDescribe = (v: InsightsDateRangeValue) => {
    if (v.range === 'custom') {
      if (v.customStart && v.customEnd) {
        return `${formatIsoDate(v.customStart)} - ${formatIsoDate(v.customEnd)}`;
      }
      if (v.customStart) return `From ${formatIsoDate(v.customStart)}`;
      if (v.customEnd) return `Until ${formatIsoDate(v.customEnd)}`;
      return 'Custom';
    }
    return DATE_RANGE_LABELS[v.range];
  };

  const sheetFilters = useMemo<DrillDownFilterConfig[]>(
    () => [
      {
        key: 'category',
        icon: 'pricetag-outline',
        label: 'Category',
        subViewTitle: 'Category',
        value: selectedCategoryId === 'all' ? 'all' : String(selectedCategoryId),
        defaultValue: 'all',
        describe: (v) => categoryLabelFor(v as string),
        isActive: (v) => (v as string) !== 'all',
        onApply: (v) => setSelectedCategoryId(v === 'all' ? 'all' : Number(v)),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={categoryOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v);
              close();
            }}
            searchPlaceholder="Search categories"
            accessibilityLabel="Filter by category"
          />
        ),
      },
      {
        key: 'trip',
        icon: 'airplane-outline',
        label: 'Trip',
        subViewTitle: 'Trip',
        value: tripId === 'all' ? 'all' : String(tripId),
        defaultValue: 'all',
        describe: (v) => tripLabelFor(v as string),
        isActive: (v) => (v as string) !== 'all',
        disabled: trips.length <= 1,
        disabledHint: trips.length <= 1 ? 'Add another trip to filter' : undefined,
        onApply: (v) => setTripId(v === 'all' ? 'all' : Number(v)),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={tripOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v);
              close();
            }}
            searchPlaceholder="Search trips"
            accessibilityLabel="Filter by trip"
          />
        ),
      },
      {
        key: 'dateRange',
        icon: 'calendar-outline',
        label: 'Date range',
        subViewTitle: 'Date range',
        // Compound value so the 'custom' bounds ride along with the range.
        // Split back into the hook's two setters inside onApply.
        value: {
          range: dateRange,
          customStart: customStartDate,
          customEnd: customEndDate,
        } as InsightsDateRangeValue,
        defaultValue: {
          range: 'all',
          customStart: null,
          customEnd: null,
        } as InsightsDateRangeValue,
        describe: (v) => dateRangeDescribe(v as InsightsDateRangeValue),
        isActive: (v) => (v as InsightsDateRangeValue).range !== 'all',
        onApply: (v) => {
          const next = v as InsightsDateRangeValue;
          if (next.range === 'custom') {
            setCustomDateRange(next.customStart, next.customEnd);
          } else {
            setDateRange(next.range);
          }
        },
        renderPicker: ({ value, setValue, close, toast: toastFn }) => (
          <InsightsDateRangePicker
            value={value as InsightsDateRangeValue}
            setValue={(next) => setValue(next)}
            close={close}
            onToast={toastFn}
          />
        ),
      },
      {
        key: 'continent',
        icon: 'globe-outline',
        label: 'Continent',
        subViewTitle: 'Continent',
        value: continent,
        defaultValue: 'all',
        describe: (v) => ((v as string) === 'all' ? 'All continents' : (v as string)),
        isActive: (v) => (v as string) !== 'all',
        disabled: availableContinents.length === 0,
        disabledHint:
          availableContinents.length === 0 ? 'No trip locations yet' : undefined,
        onApply: (v) => setContinent(v as InsightsContinent),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={continentOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v === 'all' ? 'all' : v);
              close();
            }}
            searchPlaceholder="Search continents"
            accessibilityLabel="Filter by continent"
          />
        ),
      },
      {
        key: 'country',
        icon: 'flag-outline',
        label: 'Country',
        subViewTitle: 'Country',
        value: country,
        defaultValue: 'all',
        describe: (v) => {
          const s = v as string;
          if (s === 'all') return 'All countries';
          const flag = countryFlag(s);
          return flag ? `${flag} ${s}` : s;
        },
        isActive: (v) => (v as string) !== 'all',
        disabled: availableCountries.length === 0,
        disabledHint: availableCountries.length === 0 ? 'No trip locations yet' : undefined,
        onApply: (v) => setCountry(v as InsightsCountry),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={countryOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v);
              close();
            }}
            searchPlaceholder="Search countries"
            accessibilityLabel="Filter by country"
          />
        ),
      },
    ],
    [
      selectedCategoryId,
      tripId,
      dateRange,
      customStartDate,
      customEndDate,
      continent,
      country,
      trips,
      categories,
      availableContinents,
      availableCountries,
      categoryOptions,
      tripOptions,
      continentOptions,
      countryOptions,
      setSelectedCategoryId,
      setTripId,
      setDateRange,
      setCustomDateRange,
      setContinent,
      setCountry,
    ],
  );

  // One-tap relax actions shown in the empty state when the combined
  // filter returns zero - lets the user widen the most restrictive
  // dimension without losing the rest of their selection.
  const relaxActions = useMemo(() => {
    const actions: {
      label: string;
      icon?: keyof typeof Ionicons.glyphMap;
      onPress: () => void;
    }[] = [];
    if (dateRange !== 'all') {
      actions.push({
        label: 'Any date',
        icon: 'calendar-outline',
        onPress: () => setDateRange('all'),
      });
    }
    if (selectedCategoryId !== 'all') {
      actions.push({
        label: 'Any category',
        icon: 'pricetag-outline',
        onPress: () => setSelectedCategoryId('all'),
      });
    }
    if (status !== 'all') {
      actions.push({
        label: 'Any status',
        icon: 'checkmark-circle-outline',
        onPress: () => setStatus('all'),
      });
    }
    if (tripId !== 'all') {
      actions.push({
        label: 'All trips',
        icon: 'airplane-outline',
        onPress: () => setTripId('all'),
      });
    }
    if (continent !== 'all') {
      actions.push({
        label: 'Any continent',
        icon: 'globe-outline',
        onPress: () => setContinent('all'),
      });
    }
    if (country !== 'all') {
      actions.push({
        label: 'Any country',
        icon: 'flag-outline',
        onPress: () => setCountry('all'),
      });
    }
    if (searchQuery) {
      actions.push({
        label: 'Clear search',
        icon: 'search-outline',
        onPress: () => setSearchQuery(''),
      });
    }
    return actions;
  }, [
    dateRange,
    selectedCategoryId,
    status,
    tripId,
    continent,
    country,
    searchQuery,
    setDateRange,
    setSelectedCategoryId,
    setStatus,
    setTripId,
    setContinent,
    setCountry,
    setSearchQuery,
  ]);

  // --- Saved-filter presets ---
  const scopedSavedFilters = useMemo(
    () => savedFilters.filter((f) => f.filterType === SCOPE),
    [savedFilters],
  );

  // Apply a deserialized filter payload by dispatching each known key to
  // its setter. Unknown or malformed keys are silently skipped so a legacy
  // row can't crash the UI.
  const applyState = useCallback(
    (state: Record<string, string>) => {
      if (typeof state.searchQuery === 'string') setSearchQuery(state.searchQuery);
      if (state.selectedCategoryId === 'all') setSelectedCategoryId('all');
      else if (state.selectedCategoryId && !Number.isNaN(Number(state.selectedCategoryId))) {
        setSelectedCategoryId(Number(state.selectedCategoryId));
      }
      if (state.status === 'all' || state.status === 'planned' || state.status === 'completed') {
        setStatus(state.status);
      }
      if (
        state.dateRange === 'all' ||
        state.dateRange === 'today' ||
        state.dateRange === 'week' ||
        state.dateRange === 'month'
      ) {
        setDateRange(state.dateRange);
      } else if (state.dateRange === 'custom') {
        setCustomDateRange(state.customStartDate ?? null, state.customEndDate ?? null);
      }
      if (state.tripId === 'all') setTripId('all');
      else if (state.tripId && !Number.isNaN(Number(state.tripId))) {
        setTripId(Number(state.tripId));
      }
      if (typeof state.continent === 'string') {
        setContinent(state.continent as InsightsContinent);
      }
      if (typeof state.country === 'string') {
        setCountry(state.country as InsightsCountry);
      }
    },
    [
      setSearchQuery,
      setSelectedCategoryId,
      setStatus,
      setDateRange,
      setCustomDateRange,
      setTripId,
      setContinent,
      setCountry,
    ],
  );

  const handleApplySaved = useCallback(
    (f: SavedFilter) => {
      try {
        const parsed = JSON.parse(f.filterValue) as Record<string, string>;
        applyState(parsed);
      } catch {
        // Corrupted payload - silently ignore rather than crashing.
      }
    },
    [applyState],
  );

  // Short human-readable summary of the current filter state - used as the
  // default name in the save prompt. Insights-specific so it includes
  // trip / continent / country which Activities' shared describer omits.
  const describeCurrent = useCallback(
    (state: Record<string, string>): string => {
      const parts: string[] = [];
      if (state.selectedCategoryId && state.selectedCategoryId !== 'all') {
        const name = categories.find((c) => String(c.id) === state.selectedCategoryId)?.name;
        if (name) parts.push(name);
      }
      if (state.status && state.status !== 'all') parts.push(state.status);
      if (state.dateRange && state.dateRange !== 'all') parts.push(state.dateRange);
      if (state.tripId && state.tripId !== 'all') {
        const name = trips.find((t) => String(t.id) === state.tripId)?.name;
        if (name) parts.push(name);
      }
      if (state.continent && state.continent !== 'all') parts.push(state.continent);
      if (state.country && state.country !== 'all') parts.push(state.country);
      if (state.searchQuery) parts.push(`"${state.searchQuery.slice(0, 12)}"`);
      return parts.length > 0 ? parts.join(' · ') : 'My filter';
    },
    [categories, trips],
  );

  const handleSaveCurrent = useCallback(async () => {
    const state: Record<string, string> = {
      searchQuery,
      selectedCategoryId: selectedCategoryId === 'all' ? 'all' : String(selectedCategoryId),
      status,
      dateRange,
      customStartDate: customStartDate ?? '',
      customEndDate: customEndDate ?? '',
      tripId: tripId === 'all' ? 'all' : String(tripId),
      continent,
      country,
    };
    const hint = describeCurrent(state);
    const name = await promptFilterName(hint);
    if (!name) return;
    await saveFilter(name, SCOPE, JSON.stringify(state));
    showToast(`Saved "${name}"`, 'success');
  }, [
    searchQuery,
    selectedCategoryId,
    status,
    dateRange,
    customStartDate,
    customEndDate,
    tripId,
    continent,
    country,
    describeCurrent,
    saveFilter,
    showToast,
  ]);

  const sheetPresets = useMemo<DrillDownPreset[]>(
    () =>
      scopedSavedFilters.map((f) => ({
        id: `saved:${f.id}`,
        label: f.name,
        icon: 'bookmark-outline',
        onApply: () => handleApplySaved(f),
        onRemove: () => {
          void removeFilter(f.id);
        },
      })),
    [scopedSavedFilters, handleApplySaved, removeFilter],
  );

  const noDataYet = filteredActivities.length === 0 && !isFiltered;
  const noMatches = filteredActivities.length === 0 && isFiltered;

  // Surface the most recent saved filter inline as a one-tap preset.
  // Keeps the filter sheet one gesture away while still giving power
  // users instant access to a lens they've already tuned.
  const featuredSavedFilter = scopedSavedFilters[0] ?? null;

  return (
    <ScreenContainer withTabs>
      {/* onTouchStart fires on every touch without participating in the
          responder negotiation, so it dismisses the chart tooltip as a
          side effect without fighting the ScrollView for pan gestures.
          The bar's own onPress fires on release and re-selects, so
          tapping a different bar still switches selection. */}
      <View style={styles.flex} onTouchStart={dismissTooltip}>
      <DecorativeCircles opacity={0.06} bottomRightOpacity={0.03} />
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Insights" subtitle="Your trip at a glance" />

      {/* Status segmented pills - divided tab-style row matching the
          trip screen section switcher. */}
      <SegmentedPills
        options={STATUS_OPTIONS}
        selected={status}
        onSelect={setStatus}
        accessibilityLabel="Activity status"
        variant="divided"
      />

      {/* Row 3 - featured saved-filter chip (if one exists) + Filters pill.
          Same visual as Activities so the two tabs read as one system. */}
      <View style={styles.quickRow}>
        {featuredSavedFilter ? (
          <QuickFilterChip
            label={featuredSavedFilter.name}
            icon="bookmark-outline"
            active={false}
            onPress={() => handleApplySaved(featuredSavedFilter)}
            accessibilityLabel={`Apply saved filter ${featuredSavedFilter.name}`}
          />
        ) : null}
        <FiltersPill activeCount={activeFilterCount} onPress={() => setSheetOpen(true)} />
      </View>

      {/* Flat summary strip - hairline top + bottom borders, no card chrome. */}
      <View style={[styles.summary, { borderColor: theme.cardBorder }]}>
        <SummaryCell value={`${totalMinutes}M`} label="Activity Total" />
        <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
        <SummaryCell value={String(filteredActivities.length)} label="Shown" />
        <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
        <SummaryCell
          value={`${streak.currentStreak}d`}
          label="Streak"
          icon={streak.currentStreak > 0 ? 'flame' : undefined}
          iconColor={Palette.coral}
        />
      </View>

      <ViewModeToggle
        selected={viewMode}
        onSelect={(mode) => {
          setViewMode(mode);
          setChartOffset(0);
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={dismissTooltip}
      >
        {noMatches ? (
          <EmptyState
            title="No activities match these filters"
            message="Widen one filter below, or clear them all."
            relaxActions={relaxActions}
            relaxLabel="Try removing"
            actionLabel="Clear all filters"
            onAction={clearAll}
          />
        ) : noDataYet ? (
          <EmptyState
            title="Nothing to chart yet"
            message="Log your first activity to see your trip come to life."
          />
        ) : (
          <>
            <BarChartCard
              title="Activity Minutes"
              subtitle={chartRangeLabel}
              data={barChartData}
              valueSuffix="minutes"
              onBack={() => setChartOffset((n) => n - 1)}
              onForward={() => setChartOffset((n) => Math.min(0, n + 1))}
              canGoBack={canChartGoBack}
              canGoForward={canChartGoForward}
              selectedIndex={barSelectedIndex}
              onSelectIndex={setBarSelectedIndex}
              emptyComponent={
                trips.length > 0 ? (
                  <ChartEmptyState
                    title="Nothing logged in this window"
                    message="Jump into your trips and log an activity to bring your insights to life."
                    actionLabel="View Trips"
                    onAction={() => {
                      haptics.light();
                      router.push('/(tabs)');
                    }}
                  />
                ) : (
                  <ChartEmptyState
                    title="No trips yet"
                    message="Plan your first trip to start filling in your insights."
                    actionLabel="Plan a trip"
                    onAction={() => {
                      haptics.light();
                      router.push('/trip/add');
                    }}
                  />
                )
              }
            />

            <PieChartCard title="Activity By Category in Minutes" data={categoryPieData} />

            <Collapsible title="Activity Streak" defaultExpanded>
              <StreakCard streak={streak} />
            </Collapsible>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
        presets={sheetPresets}
        presetsTitle="Suggested filters"
        onSaveCurrent={handleSaveCurrent}
        onShowToast={showToast}
      />
      </View>
    </ScreenContainer>
  );
}


// ----- Local subcomponents ------------------------------------------------

type SummaryCellProps = {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
};

function SummaryCell({ value, label, icon, iconColor }: SummaryCellProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.summaryCell}>
      <View style={styles.summaryValueRow}>
        {icon ? <Ionicons name={icon} size={14} color={iconColor ?? theme.textPrimary} /> : null}
        <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{value}</Text>
      </View>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

type CollapsibleProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

function Collapsible({ title, children, defaultExpanded = false }: CollapsibleProps) {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.collapsibleWrap}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.collapsibleHeader,
          { borderColor: theme.cardBorder },
          pressed && styles.collapsiblePressed,
        ]}
      >
        <Text
          style={[
            SharedStyles.sectionTitle,
            styles.collapsibleTitle,
            { color: theme.textPrimary },
          ]}
        >
          {title}
        </Text>
        <View style={styles.collapsibleSpacer} />
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>
      {expanded ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  // Flat summary strip - top + bottom hairlines, no card chrome.
  summary: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  summaryCell: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryDivider: {
    height: 24,
    width: 1,
  },
  collapsibleWrap: {
    marginTop: Spacing.sm,
  },
  collapsibleHeader: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  collapsiblePressed: {
    opacity: 0.7,
  },
  collapsibleTitle: {
    marginBottom: 0,
  },
  collapsibleSpacer: {
    flex: 1,
  },
  collapsibleBody: {
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
