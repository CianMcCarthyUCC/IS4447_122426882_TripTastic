import { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTargets, useCategories, useActivities, useAppTheme } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { TargetList } from '@/components/lists';
import { SearchBar, FilterChips } from '@/components/forms';
import { SummaryBanner } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing } from '@/constants';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';

/**
 * Targets tab — search + summary banner + period filter + FAB.
 */
export default function TargetsScreen() {
  const router = useRouter();
  const { targets } = useTargets();
  const { categories } = useCategories();
  const { activities } = useActivities();
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');

  const periodChips = useMemo<ChipOption[]>(() => [
    { label: 'All', value: 'all' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ], []);

  const filtered = useMemo(() => {
    let result = targets;

    // Text search by category name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        return cat?.name.toLowerCase().includes(q);
      });
    }

    // Period filter
    if (periodFilter !== 'all') {
      result = result.filter((t) => t.period === periodFilter);
    }

    return result;
  }, [targets, categories, searchQuery, periodFilter]);

  const onTrack = useMemo(() => {
    return targets.filter((t) => {
      const current = activities
        .filter((a) => {
          if (a.categoryId !== t.categoryId) return false;
          if (t.tripId !== null && a.tripId !== t.tripId) return false;
          return true;
        })
        .reduce((sum, a) => sum + a.metric, 0);
      return current >= t.targetValue;
    }).length;
  }, [targets, activities]);

  const isFiltered = searchQuery || periodFilter !== 'all';
  const noResults = isFiltered && filtered.length === 0;

  return (
    <ScreenContainer withTabs>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Goals</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {targets.length > 0 ? `${targets.length} goals set` : 'Set goals to track your progress'}
        </Text>
      </View>

      <SummaryBanner onTrack={onTrack} total={targets.length} />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search goals by category..."
        suggestions={categories.slice(0, 4).map((c) => c.name)}
      />

      <FilterChips
        options={periodChips}
        selected={periodFilter}
        onSelect={setPeriodFilter}
        accessibilityLabel="Filter by period"
      />

      {noResults ? (
        <EmptyState
          title="No goals found"
          message={searchQuery ? `No goals match "${searchQuery}".` : 'No goals match this period.'}
          suggestions={categories.slice(0, 3).map((c) => c.name)}
          onSuggestionPress={setSearchQuery}
          actionLabel="Clear filters"
          onAction={() => { setSearchQuery(''); setPeriodFilter('all'); }}
        />
      ) : (
        <TargetList targets={filtered} categories={categories} activities={activities} />
      )}

      <FAB onPress={() => router.push('/target/add')} icon="flag" accessibilityLabel="Add target" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: Spacing.xs },
});
