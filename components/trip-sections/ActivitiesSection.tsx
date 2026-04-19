import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useActivities,
  useCategories,
  useFilteredActivities,
  useSavedFilters,
  useSuggestionDismissal,
} from '@/hooks';
import { ActivityList } from '@/components/lists';
import {
  SearchBar,
  FilterChips,
  SegmentedPills,
  SavedFiltersBar,
  SuggestionChip,
} from '@/components/forms';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { SegmentOption } from '@/components/forms/SegmentedPills';
import type { DateRange } from '@/hooks/useFilteredData';
import type { SavedFilter } from '@/hooks/useSavedFilters';
import {
  suggestActivityFilter,
  promptFilterName,
  describeFilter,
} from '@/utils';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Activity } from '@/types';

type Props = {
  activities: Activity[];
};

const SCOPE = 'activities';
const SUGGESTION_KEY = 'suggestion:activities';

const DATE_RANGE_OPTIONS: ReadonlyArray<SegmentOption<DateRange>> = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

/**
 * Activities section of the trip detail screen — search + category filter +
 * date range + saved-filter presets + rule-based suggestion chip + list + FAB.
 * Self-contained: owns its own filter state via `useFilteredActivities`.
 */
export function ActivitiesSection({ activities }: Props) {
  const router = useRouter();
  const theme = useAppTheme();
  const { categories } = useCategories();
  const { toggleFavourite } = useActivities();
  const { savedFilters, saveFilter, removeFilter } = useSavedFilters();
  const { isDismissed, dismiss } = useSuggestionDismissal();

  const {
    filtered,
    searchQuery,
    selectedCategory,
    dateRange,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
    isFiltered,
    resetFilters,
  } = useFilteredActivities(activities, categories);

  const categoryChips = useMemo<ChipOption[]>(
    () => [
      { label: 'All', value: 'all' },
      ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
    ],
    [categories],
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const scopedSavedFilters = useMemo(
    () => savedFilters.filter((f) => f.filterType === SCOPE),
    [savedFilters],
  );

  const suggestion = useMemo(
    () => suggestActivityFilter(activities, categories),
    [activities, categories],
  );
  const showSuggestion = suggestion !== null && !isDismissed(SUGGESTION_KEY);

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
    },
    [setSearchQuery, setSelectedCategory, setDateRange],
  );

  const handleApplySaved = useCallback(
    (f: SavedFilter) => {
      try {
        const parsed = JSON.parse(f.filterValue) as Record<string, string>;
        applyState(parsed);
      } catch {
        // Corrupted payload — silently ignore so the UI never crashes on
        // a malformed legacy row.
      }
    },
    [applyState],
  );

  const handleApplySuggestion = useCallback(() => {
    if (suggestion) applyState(suggestion.apply);
  }, [applyState, suggestion]);

  const handleSaveCurrent = useCallback(async () => {
    const state: Record<string, string> = {
      searchQuery,
      selectedCategory,
      dateRange,
    };
    const hint = describeFilter(state, categoryNameById);
    const name = await promptFilterName(hint);
    if (!name) return;
    await saveFilter(name, SCOPE, JSON.stringify(state));
  }, [searchQuery, selectedCategory, dateRange, categoryNameById, saveFilter]);

  // Pin the trip's favourite to the top so the #1-priority activity is
  // always the first thing the user sees when the list opens. Plain
  // date order is preserved for everything else, which keeps the rest
  // of the list predictable.
  const sortedFiltered = useMemo(() => {
    const favourite = filtered.find((a) => a.isFavourite);
    if (!favourite) return filtered;
    return [favourite, ...filtered.filter((a) => a.id !== favourite.id)];
  }, [filtered]);

  const handleToggleFavourite = useCallback(
    (activity: Activity) => {
      void toggleFavourite(activity.tripId, activity.id);
    },
    [toggleFavourite],
  );

  // All pre-list UI lives inside a single View that becomes the FlatList's
  // `ListHeaderComponent`. Rendering it as the first row of the scrollable
  // surface is what makes touches on the search bar / filter chips / saved
  // filters count as in-bounds for the list's pan gesture — without this,
  // the pre-list siblings sit outside the scroll surface and a vertical
  // drag on them does nothing. Memoized on its dependencies so the
  // FlatList doesn't re-render the header on every keystroke.
  const listHeader = useMemo(
    () => (
      <View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activities..."
          suggestions={categories.slice(0, 4).map((c) => c.name)}
        />
        <FilterChips
          options={categoryChips}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          accessibilityLabel="Filter by category"
        />
        <SegmentedPills
          options={DATE_RANGE_OPTIONS}
          selected={dateRange}
          onSelect={setDateRange}
          accessibilityLabel="Filter by date range"
        />
        {showSuggestion && suggestion ? (
          <SuggestionChip
            label={suggestion.label}
            onApply={handleApplySuggestion}
            onDismiss={() => dismiss(SUGGESTION_KEY)}
          />
        ) : null}
        <SavedFiltersBar
          filters={scopedSavedFilters}
          onApply={handleApplySaved}
          onRemove={removeFilter}
        />
        {isFiltered ? (
          <Pressable
            onPress={handleSaveCurrent}
            accessibilityRole="button"
            accessibilityLabel="Save current filter"
            style={({ pressed }) => [
              styles.saveRow,
              { backgroundColor: theme.tagBackground },
              pressed && styles.saveRowPressed,
            ]}
          >
            <Ionicons name="bookmark-outline" size={14} color={theme.accentAction} />
            <Text style={[styles.saveText, { color: theme.textPrimary }]}>
              Save current filter
            </Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [
      searchQuery,
      setSearchQuery,
      categories,
      categoryChips,
      selectedCategory,
      setSelectedCategory,
      dateRange,
      setDateRange,
      showSuggestion,
      suggestion,
      handleApplySuggestion,
      dismiss,
      scopedSavedFilters,
      handleApplySaved,
      removeFilter,
      isFiltered,
      handleSaveCurrent,
      theme.tagBackground,
      theme.accentAction,
      theme.textPrimary,
    ],
  );

  // When the filtered result is empty because of filters (rather than zero
  // data), swap in a filter-aware empty state with a Clear action so the
  // user has a one-tap escape from an over-restrictive combo.
  const listEmpty = isFiltered ? (
    <EmptyState
      title="No results"
      message="Try a different search."
      actionLabel="Clear filters"
      onAction={resetFilters}
    />
  ) : null;

  return (
    <>
      <ActivityList
        activities={sortedFiltered}
        categories={categories}
        onToggleFavourite={handleToggleFavourite}
        listHeaderComponent={listHeader}
        listEmptyComponent={listEmpty}
      />
      <FAB
        onPress={() => router.push('/activity/add')}
        label="Log Activity"
        accessibilityLabel="Log activity"
      />
    </>
  );
}

const styles = StyleSheet.create({
  saveRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveRowPressed: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
