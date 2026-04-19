import { useMemo, useState } from 'react';
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
import {
  useInsightsData,
  useInsightsFilters,
  useAppTheme,
  useToast,
} from '@/hooks';
import { useActivityContext } from '@/context';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { FilterChips, SearchBar, ViewModeToggle } from '@/components/forms';
import { BarChartCard, LineChartCard, PieChartCard } from '@/components/charts';
import { StreakCard } from '@/components/cards';
import { EmptyState, Toast } from '@/components/feedback';
import { InsightsFilterSheet } from '@/components/insights';
import { BorderRadius, Palette, SharedStyles, Spacing } from '@/constants';
import { computeStreaks } from '@/utils/streakCalculator';
import type { ReactNode } from 'react';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { Category, ViewMode } from '@/types';

// LayoutAnimation on Android needs an explicit opt-in on older RN builds.
// Safe no-op once enabled; guards against double-enabling on fast refresh.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Insights tab — charts + interactive search/filter pipeline. Follows
 * mobile UX best practices gathered during research:
 *   - Debounced search (300ms) with descriptive placeholder
 *   - Primary filter (category) as horizontally-scrollable chips row
 *   - Secondary filters (status, date range, trip) behind a sheet with
 *     an active-filter count badge + clear-all escape hatch
 *   - Live empty state when filters return nothing
 */
export default function InsightsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [sheetOpen, setSheetOpen] = useState(false);
  const theme = useAppTheme();
  const { toast, showToast, hideToast } = useToast();

  const {
    // search state
    searchQuery,
    setSearchQuery,
    // primary filter
    selectedCategoryId,
    setSelectedCategoryId,
    // secondary filters
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
    // derived
    filteredActivities,
    activeFilterCount,
    isFiltered,
    clearAll,
    categories,
    trips,
    availableContinents,
    availableCountries,
  } = useInsightsFilters();

  const { barChartData, plannedLine, completedLine, categoryPieData } = useInsightsData(
    viewMode,
    filteredActivities,
  );

  const totalMinutes = useMemo(
    () => filteredActivities.reduce((sum, a) => sum + a.metric, 0),
    [filteredActivities],
  );

  // Streak is computed off the FULL activity set, not the filtered one —
  // a "daily streak" is a calendar property of the user's logging habit,
  // not something a category/date filter should mask.
  const { activities: allActivities } = useActivityContext();
  const streak = useMemo(() => computeStreaks(allActivities), [allActivities]);

  const categoryChips: ChipOption[] = useMemo(
    () => [
      { label: 'All', value: 'all' },
      ...categories.map((c: Category) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
      })),
    ],
    [categories],
  );

  const handleCategoryChipSelect = (value: string) => {
    setSelectedCategoryId(value === 'all' ? 'all' : Number(value));
  };

  const noDataYet = filteredActivities.length === 0 && !isFiltered;
  const noMatches = filteredActivities.length === 0 && isFiltered;

  return (
    <ScreenContainer withTabs>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Insights" subtitle="Your trip at a glance" />

      {/* Row 1 — search (debounced via useDebouncedValue in the filter hook) */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search activities or notes…"
        suggestions={['Food', 'Sightseeing', 'Museum', 'Transport']}
      />

      {/* Row 2 — category chips + secondary-filter affordance. Horizontal
          scroll keeps compact even with many categories; the "Filters"
          button sits in a parallel row so chips don't jostle with it. */}
      <View style={styles.chipsRow}>
        <View style={styles.chipsScroll}>
          <FilterChips
            options={categoryChips}
            selected={selectedCategoryId === 'all' ? 'all' : String(selectedCategoryId)}
            onSelect={handleCategoryChipSelect}
            accessibilityLabel="Filter by category"
          />
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0
              ? `Filters, ${activeFilterCount} active`
              : 'Open filters'
          }
          style={[
            styles.filtersBtn,
            {
              backgroundColor: activeFilterCount > 0 ? Palette.coral : theme.cardBackground,
              borderColor: activeFilterCount > 0 ? Palette.coral : theme.cardBorder,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? Palette.white : theme.textPrimary}
          />
          <Text
            style={[
              styles.filtersBtnText,
              { color: activeFilterCount > 0 ? Palette.white : theme.textPrimary },
            ]}
          >
            Filters
          </Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Clear-all escape hatch — only surfaces when at least one filter
          (including search) is active, per "provide an escape hatch" NN/g
          guidance. Shown above the summary so it's reachable without
          scrolling back up after exploring filtered charts. */}
      {isFiltered ? (
        <Pressable
          onPress={clearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          style={styles.clearAllRow}
        >
          <Ionicons name="close-circle" size={14} color={Palette.coral} />
          <Text style={[styles.clearAllText, { color: Palette.coral }]}>
            Clear filters
          </Text>
        </Pressable>
      ) : null}

      <View
        style={[
          styles.summary,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        ]}
      >
        <SummaryCell value={`${totalMinutes}m`} label="Total" />
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

      <ViewModeToggle selected={viewMode} onSelect={setViewMode} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // Dragging dismisses the keyboard (and collapses any SearchBar
        // dropdown). Replaces the tap-on-background dismiss that lived
        // in ScreenContainer's removed press wrapper.
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {noMatches ? (
          <EmptyState
            title="No activities match your filters"
            message="Try clearing a filter or broadening your search."
            actionLabel="Clear filters"
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
              title={`Activity Minutes (${viewMode})`}
              data={barChartData}
              valueSuffix="m"
            />

            <LineChartCard
              title="Planned vs Completed"
              data={plannedLine}
              data2={completedLine}
              color={Palette.skyBlue}
              color2={Palette.coral}
              label1="Planned"
              label2="Completed"
            />

            <PieChartCard title="By Category" data={categoryPieData} />

            <Collapsible title="Activity Streak" defaultExpanded>
              <StreakCard streak={streak} />
            </Collapsible>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Secondary-filter bottom sheet. Extracted to its own component so
          this screen stays focused on layout + data wiring. */}
      <InsightsFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        status={status}
        onStatusChange={setStatus}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateRangeChange={setCustomDateRange}
        tripId={tripId}
        onTripIdChange={setTripId}
        continent={continent}
        onContinentChange={setContinent}
        country={country}
        onCountryChange={setCountry}
        trips={trips}
        availableContinents={availableContinents}
        availableCountries={availableCountries}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAll}
        onShowToast={showToast}
      />
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
  chipsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chipsScroll: {
    flex: 1,
  },
  filtersBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  filtersBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filtersBadge: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: BorderRadius.pill,
    height: 18,
    justifyContent: 'center',
    marginLeft: 4,
    minWidth: 18,
    paddingHorizontal: 5,
  },
  filtersBadgeText: {
    color: Palette.coral,
    fontSize: 11,
    fontWeight: '800',
  },
  clearAllRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summary: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
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
