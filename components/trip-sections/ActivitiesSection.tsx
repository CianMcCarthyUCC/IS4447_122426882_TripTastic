import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useActivities,
  useCategories,
  useCategoryLookup,
  useFilteredActivities,
  useSavedFilters,
  useToast,
} from '@/hooks';
import { ActivityList } from '@/components/lists';
import {
  FiltersPill,
  SearchBar,
  SegmentedPills,
  QuickFilterChip,
  SearchableListPicker,
} from '@/components/forms';
import type { SearchableOption } from '@/components/forms';
import { PressableOpacity } from '@/components/buttons';
import { ConfirmDialog, EmptyState, Toast } from '@/components/feedback';
import { InsightsDateRangePicker } from '@/components/insights/InsightsDateRangePicker/InsightsDateRangePicker';
import { formatIsoDate } from '@/utils/dateHelpers';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig, DrillDownPreset } from '@/components/modals';
import type { SegmentOption } from '@/components/forms/SegmentedPills';
import type { DateRange, StatusFilter, SortDirection } from '@/hooks/useFilteredData';
import type { SavedFilter } from '@/hooks/useSavedFilters';
import { promptFilterName, describeFilter } from '@/utils';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';
import type { Activity } from '@/types';

type Props = {
  activities: Activity[];
};

const SCOPE = 'activities';

const DATE_RANGE_OPTIONS: ReadonlyArray<SegmentOption<DateRange>> = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const STATUS_OPTIONS: ReadonlyArray<{
  label: string;
  value: StatusFilter;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { label: 'All', value: 'all', icon: 'layers-outline' },
  { label: 'Planned', value: 'planned', icon: 'calendar-outline' },
  { label: 'Completed', value: 'completed', icon: 'checkmark-circle-outline' },
];

/**
 * The Activities tab on the trip detail screen. Shows the trip's activity
 * list with a search bar, filter chips and a filter sheet for category
 * and date range, and a floating action button for adding a new activity.
 */
export function ActivitiesSection({ activities }: Props) {
  const router = useRouter();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { categories } = useCategories();
  const { toggleFavourite, toggleComplete, deleteActivity } = useActivities();
  const { savedFilters, saveFilter, removeFilter } = useSavedFilters();
  const { toast, showToast, hideToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);

  const {
    filtered,
    searchQuery,
    selectedCategory,
    dateRange,
    customStart,
    customEnd,
    status,
    favouritesOnly,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
    setCustomDateRange,
    setStatus,
    setFavouritesOnly,
    setSortDirection,
    isFiltered,
    resetFilters,
  } = useFilteredActivities(activities, categories);

  const categoryOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All categories', value: 'all', icon: 'apps-outline' },
      ...categories.map((c) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
        icon: c.icon as SearchableOption['icon'],
      })),
    ],
    [categories],
  );

  const categoryById = useCategoryLookup(categories);

  const scopedSavedFilters = useMemo(
    () => savedFilters.filter((f) => f.filterType === SCOPE),
    [savedFilters],
  );

  const applyState = useCallback(
    (state: Record<string, string>) => {
      if (typeof state.searchQuery === 'string') setSearchQuery(state.searchQuery);
      if (typeof state.selectedCategory === 'string') setSelectedCategory(state.selectedCategory);
      if (
        state.dateRange === 'all' ||
        state.dateRange === 'today' ||
        state.dateRange === 'week' ||
        state.dateRange === 'month'
      ) {
        setDateRange(state.dateRange);
      }
      if (state.status === 'all' || state.status === 'planned' || state.status === 'completed') {
        setStatus(state.status);
      }
      if (state.favouritesOnly === 'true' || state.favouritesOnly === 'false') {
        setFavouritesOnly(state.favouritesOnly === 'true');
      }
      if (state.sortDirection === 'asc' || state.sortDirection === 'desc') {
        setSortDirection(state.sortDirection);
      }
    },
    [setSearchQuery, setSelectedCategory, setDateRange, setStatus, setFavouritesOnly, setSortDirection],
  );

  const handleApplySaved = useCallback(
    (f: SavedFilter) => {
      try {
        const parsed = JSON.parse(f.filterValue) as Record<string, string>;
        applyState(parsed);
      } catch {
        // Corrupted payload - silently ignore so the UI never crashes on
        // a malformed legacy row.
      }
    },
    [applyState],
  );

  const handleSaveCurrent = useCallback(async () => {
    const state: Record<string, string> = {
      searchQuery,
      selectedCategory,
      dateRange,
      status,
      favouritesOnly: String(favouritesOnly),
      sortDirection,
    };
    const hint = describeFilter(state, categoryById);
    const name = await promptFilterName(hint);
    if (!name) return;
    await saveFilter(name, SCOPE, JSON.stringify(state));
  }, [searchQuery, selectedCategory, dateRange, status, favouritesOnly, sortDirection, categoryById, saveFilter]);

  // All favourites pin to the top in the order they were starred
  // (earliest `favouritedAt` first); the remaining items keep whatever
  // order they came in with from the filter/sort pipeline.
  const sortedFiltered = useMemo(() => {
    const favs = filtered
      .filter((a) => a.isFavourite)
      .sort((a, b) => (a.favouritedAt ?? '').localeCompare(b.favouritedAt ?? ''));
    if (favs.length === 0) return filtered;
    const favIds = new Set(favs.map((a) => a.id));
    return [...favs, ...filtered.filter((a) => !favIds.has(a.id))];
  }, [filtered]);

  const handleToggleFavourite = useCallback(
    (activity: Activity) => {
      const wasFavourite = activity.isFavourite;
      haptics.success();
      showToast(wasFavourite ? 'Removed from favourites' : 'Added to favourites', 'accent');
      void toggleFavourite(activity.tripId, activity.id);
    },
    [toggleFavourite, haptics, showToast],
  );

  const handleToggleComplete = useCallback(
    (activity: Activity) => {
      const wasCompleted = activity.status === 'completed';
      haptics.success();
      showToast(
        wasCompleted ? 'Marked as planned' : 'Marked as completed',
        'accent',
      );
      void toggleComplete(activity);
    },
    [toggleComplete, haptics, showToast],
  );

  const handleRequestDelete = useCallback((activity: Activity) => {
    setPendingDelete(activity);
  }, []);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteActivity(target.id);
      haptics.success();
      showToast('Activity deleted', 'accent');
    } catch {
      haptics.error();
      showToast('Failed to delete activity', 'error');
    }
  }, [pendingDelete, deleteActivity, haptics, showToast]);

  // Drill-down sheet config: category + date range. Heterogeneous filter
  // types share the same sheet via the `DrillDownFilterConfig` contract -
  // each row supplies its own describe/isActive/renderPicker closures.
  const categoryNameForValue = (v: string) =>
    v === 'all'
      ? 'All categories'
      : categories.find((c) => String(c.id) === v)?.name ?? 'All categories';

  const dateRangeLabelForValue = (v: DateRange) => {
    if (v === 'all') return 'All time';
    if (v === 'today') return 'Today';
    if (v === 'week') return 'This week';
    if (v === 'month') return 'This month';
    if (customStart && customEnd) return `${formatIsoDate(customStart)} - ${formatIsoDate(customEnd)}`;
    if (customStart) return `From ${formatIsoDate(customStart)}`;
    if (customEnd) return `Until ${formatIsoDate(customEnd)}`;
    return 'Custom';
  };

  const sheetFilters = useMemo<DrillDownFilterConfig[]>(
    () => [
      {
        key: 'category',
        icon: 'pricetag-outline',
        label: 'Category',
        subViewTitle: 'Category',
        value: selectedCategory,
        defaultValue: 'all',
        describe: (v) => categoryNameForValue(v as string),
        isActive: (v) => (v as string) !== 'all',
        onApply: (v) => setSelectedCategory(v as string),
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
        key: 'dateRange',
        icon: 'calendar-outline',
        label: 'Date range',
        subViewTitle: 'Date range',
        value: dateRange,
        defaultValue: 'all',
        describe: (v) => dateRangeLabelForValue(v as DateRange),
        isActive: (v) => (v as DateRange) !== 'all',
        onApply: (v) => setDateRange(v as DateRange),
        renderPicker: ({ value, setValue, close }) => (
          <InsightsDateRangePicker
            value={{
              range: value as DateRange,
              customStart,
              customEnd,
            }}
            setValue={(v) => {
              setValue(v.range);
              setDateRange(v.range);
              setCustomDateRange(v.customStart, v.customEnd);
            }}
            close={close}
          />
        ),
      },
    ],
    // categoryOptions already memoised, selected/dateRange drive re-render,
    // setters are stable from useFilteredActivities.
    [categoryOptions, selectedCategory, dateRange, customStart, customEnd, categories, setSelectedCategory, setDateRange, setCustomDateRange],
  );

  const appliedFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) + (dateRange !== 'all' ? 1 : 0);

  // Built-in quick preset - always available, surfaces the most common
  // "what am I doing this week" lens without requiring the user to first
  // save a filter themselves.
  const sheetPresets = useMemo<DrillDownPreset[]>(() => {
    const presets: DrillDownPreset[] = [];

    const sightseeing = categories.find((c) => c.name.toLowerCase() === 'sightseeing');
    if (sightseeing) {
      presets.push({
        id: 'builtin:sightseeing-this-week',
        label: 'Sightseeing this week',
        icon: 'sparkles-outline',
        onApply: () => {
          setSelectedCategory(String(sightseeing.id));
          setDateRange('week');
        },
      });
    }

    // User-saved filters - reuse the existing apply/remove flow.
    scopedSavedFilters.forEach((f) => {
      presets.push({
        id: `saved:${f.id}`,
        label: f.name,
        icon: 'bookmark-outline',
        onApply: () => handleApplySaved(f),
        onRemove: () => {
          void removeFilter(f.id);
        },
      });
    });

    return presets;
  }, [categories, scopedSavedFilters, handleApplySaved, removeFilter, setSelectedCategory, setDateRange]);

  // All pre-list UI lives inside a single View that becomes the FlatList's
  // `ListHeaderComponent`. Rendering it as the first row of the scrollable
  // surface is what makes touches on the search bar / filter chips / saved
  // filters count as in-bounds for the list's pan gesture - without this,
  // the pre-list siblings sit outside the scroll surface and a vertical
  // drag on them does nothing. Memoized on its dependencies so the
  // FlatList doesn't re-render the header on every keystroke.
  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Activities</Text>
          <PressableOpacity
            onPress={() => { haptics.light(); router.push('/activity/add'); }}
            style={[styles.addBtn, { backgroundColor: theme.accentAction }]}
            accessibilityRole="button"
            accessibilityLabel="Log activity"
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={Palette.white} />
            <Text style={[styles.addBtnText, { color: Palette.white }]}>Log Activity</Text>
          </PressableOpacity>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activities..."
          suggestions={categories.slice(0, 4).map((c) => c.name)}
        />
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.statusSlot}>
              <QuickFilterChip
                label={opt.label}
                icon={opt.icon}
                active={status === opt.value}
                onPress={() => setStatus(opt.value)}
                accessibilityLabel={`Show ${opt.label.toLowerCase()} activities`}
                size="md"
                fill
              />
            </View>
          ))}
        </View>
        <View
          style={[styles.filterDivider, { backgroundColor: theme.cardBorder }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View style={styles.quickRow}>
          <QuickFilterChip
            label="Favourites"
            icon={favouritesOnly ? 'heart' : 'heart-outline'}
            active={favouritesOnly}
            onPress={() => setFavouritesOnly(!favouritesOnly)}
            accessibilityLabel={favouritesOnly ? 'Show all activities' : 'Show favourites only'}
          />
          <QuickFilterChip
            label={sortDirection === 'asc' ? 'Date ↑' : 'Date ↓'}
            icon="swap-vertical-outline"
            active={sortDirection === 'desc'}
            onPress={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            accessibilityLabel={`Sort by date ${sortDirection === 'asc' ? 'ascending' : 'descending'}, tap to flip`}
          />
          <FiltersPill activeCount={appliedFilterCount} onPress={() => setSheetOpen(true)} />
        </View>
      </View>
    ),
    [
      searchQuery,
      setSearchQuery,
      categories,
      status,
      setStatus,
      favouritesOnly,
      setFavouritesOnly,
      sortDirection,
      setSortDirection,
      appliedFilterCount,
      haptics,
      router,
      theme.cardBackground,
      theme.cardBorder,
      theme.accentAction,
      theme.textPrimary,
    ],
  );

  // When the filtered result is empty because of filters (rather than zero
  // data), render a filter-aware empty state: each active filter becomes a
  // one-tap "widen this" chip so the user can back out of the most
  // restrictive dimension without losing the rest of their selection, plus
  // a catch-all Clear filters escape hatch.
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
    if (selectedCategory !== 'all') {
      actions.push({
        label: 'Any category',
        icon: 'pricetag-outline',
        onPress: () => setSelectedCategory('all'),
      });
    }
    if (status !== 'all') {
      actions.push({
        label: 'Any status',
        icon: 'checkmark-circle-outline',
        onPress: () => setStatus('all'),
      });
    }
    if (favouritesOnly) {
      actions.push({
        label: 'Include non-favourites',
        icon: 'heart-outline',
        onPress: () => setFavouritesOnly(false),
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
    selectedCategory,
    status,
    favouritesOnly,
    searchQuery,
    setDateRange,
    setSelectedCategory,
    setStatus,
    setFavouritesOnly,
    setSearchQuery,
  ]);

  const listEmpty = isFiltered ? (
    <EmptyState
      title="No activities match these filters"
      message="Widen one filter below, or clear them all."
      relaxActions={relaxActions}
      relaxLabel="Try removing"
      actionLabel="Clear all filters"
      onAction={resetFilters}
    />
  ) : null;

  return (
    <>
      <Toast {...toast} position="bottom" onHide={hideToast} />
      <ActivityList
        activities={sortedFiltered}
        categories={categories}
        onToggleFavourite={handleToggleFavourite}
        onToggleComplete={handleToggleComplete}
        onDelete={handleRequestDelete}
        listHeaderComponent={listHeader}
        listEmptyComponent={listEmpty}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete activity?"
        message="This removes the activity from this trip and the insights view. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
        presets={sheetPresets}
        presetsTitle="Suggested filters"
        onSaveCurrent={handleSaveCurrent}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusSlot: {
    // Each slot owns an equal share of the row width. `minWidth: 0` and
    // the explicit flex trio let the slot shrink below its children's
    // intrinsic content width - without it, a chip's label would push
    // the slot wider than its fair share and the last chip would spill
    // off the right edge of the screen.
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  filterDivider: {
    height: 1,
    marginBottom: Spacing.md,
    opacity: 0.7,
  },
});
