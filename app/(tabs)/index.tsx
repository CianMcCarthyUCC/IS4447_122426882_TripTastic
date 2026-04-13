import { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useActivities, useCategories, useAppTheme, useHaptics, useFilteredActivities, useSavedFilters } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { ActivityList } from '@/components/lists';
import { SearchBar, FilterChips, SavedFiltersBar } from '@/components/forms';
import { StatsRow } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing } from '@/constants';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { SavedFilter } from '@/hooks/useSavedFilters';

/**
 * Activities tab — search, category/date filters, saved filters, stats, FAB.
 * Filter logic extracted to useFilteredActivities for reusability.
 */
export default function IndexScreen() {
  const router = useRouter();
  const { activities } = useActivities();
  const { categories } = useCategories();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { savedFilters, saveFilter, removeFilter } = useSavedFilters();

  const {
    filtered, searchQuery, selectedCategory, dateRange,
    setSearchQuery, setSelectedCategory, setDateRange,
    resetFilters, isFiltered, activeFilterCount,
  } = useFilteredActivities(activities, categories);

  const categoryChips = useMemo<ChipOption[]>(() => [
    { label: 'All', value: 'all' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
  ], [categories]);

  const dateChips = useMemo<ChipOption[]>(() => [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ], []);

  const totalMinutes = useMemo(() => filtered.reduce((s, a) => s + a.metric, 0), [filtered]);

  const topCategory = useMemo(() => {
    if (filtered.length === 0) return '—';
    const counts = new Map<number, number>();
    for (const a of filtered) counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
    const topId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return categories.find((c) => c.id === topId)?.name ?? '—';
  }, [filtered, categories]);

  const handleSaveFilter = useCallback(() => {
    const name = selectedCategory !== 'all'
      ? categories.find((c) => c.id === Number(selectedCategory))?.name ?? 'Filter'
      : `Date: ${dateRange}`;
    void saveFilter(name, selectedCategory !== 'all' ? 'category' : 'dateRange', selectedCategory !== 'all' ? selectedCategory : dateRange);
    haptics.success();
  }, [selectedCategory, dateRange, categories, saveFilter, haptics]);

  const handleApplySaved = useCallback((filter: SavedFilter) => {
    if (filter.filterType === 'category') setSelectedCategory(filter.filterValue);
    else if (filter.filterType === 'dateRange') setDateRange(filter.filterValue as 'all' | 'today' | 'week' | 'month');
    haptics.light();
  }, [setSelectedCategory, setDateRange, haptics]);

  const searchSuggestions = useMemo(() => categories.slice(0, 4).map((c) => c.name), [categories]);
  const noResults = isFiltered && filtered.length === 0;

  return (
    <ScreenContainer withTabs>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Trip Activities</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {activities.length > 0
            ? `${activities.length} logged · ${Math.round(activities.reduce((s, a) => s + a.metric, 0) / 60)}h on your trip`
            : 'Log what you did on your holiday — tap + to start'}
        </Text>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search activities, notes, categories..." suggestions={searchSuggestions} />

      <SavedFiltersBar filters={savedFilters} onApply={handleApplySaved} onRemove={(id) => { void removeFilter(id); haptics.light(); }} />

      <FilterChips options={categoryChips} selected={selectedCategory} onSelect={setSelectedCategory} onSave={handleSaveFilter} accessibilityLabel="Filter by category" />
      <FilterChips options={dateChips} selected={dateRange} onSelect={(v) => setDateRange(v as 'all' | 'today' | 'week' | 'month')} accessibilityLabel="Filter by date range" />

      {filtered.length > 0 && (
        <StatsRow stats={[
          { label: 'Activities', value: String(filtered.length), icon: 'list' },
          { label: 'Duration', value: `${totalMinutes}m`, icon: 'time' },
          { label: 'Top Category', value: topCategory, icon: 'trophy' },
        ]} />
      )}

      {noResults ? (
        <EmptyState
          title="No results found"
          message={searchQuery ? `Nothing matches "${searchQuery}". Try a different search or clear your filters.` : 'No activities match your current filters.'}
          suggestions={searchSuggestions}
          onSuggestionPress={setSearchQuery}
          actionLabel={`Clear ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`}
          onAction={resetFilters}
        />
      ) : (
        <ActivityList activities={filtered} categories={categories} />
      )}

      <FAB onPress={() => router.push('/activity/add')} accessibilityLabel="Add activity" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: Spacing.xs },
});
