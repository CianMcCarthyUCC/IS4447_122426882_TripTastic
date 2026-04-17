import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useActivities, useCategories, useTargets, useAppTheme, useFilteredActivities, useTrips, useCategoryLookup } from '@/hooks';
import { useInsightsData } from '@/hooks/useInsightsData';
import { ScreenContainer } from '@/components/layout';
import { ActivityList, TargetList } from '@/components/lists';
import { SearchBar, FilterChips, ViewModeToggle } from '@/components/forms';
import { TripInfoBar, StatsRow, SummaryBanner, StreakCard } from '@/components/cards';
import { BarChartCard, LineChartCard, ProgressCard } from '@/components/charts';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing, BorderRadius, Palette, SharedStyles } from '@/constants';
import { computeStreaks } from '@/utils/streakCalculator';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { ViewMode } from '@/types';

type Section = 'activities' | 'goals' | 'insights';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activities } = useActivities();
  const { categories } = useCategories();
  const { targets } = useTargets();
  const { findTripById } = useTrips();
  const theme = useAppTheme();

  const trip = findTripById(Number(id));
  const [section, setSection] = useState<Section>('activities');
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const tripActivities = useMemo(() => activities.filter((a) => a.tripId === Number(id)), [activities, id]);
  const tripTargets = useMemo(() => targets.filter((t) => t.tripId === Number(id) || t.tripId === null), [targets, id]);
  const completed = useMemo(() => tripActivities.filter((a) => a.status === 'completed').length, [tripActivities]);

  // Activities filtering
  const { filtered, searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, isFiltered, resetFilters } =
    useFilteredActivities(tripActivities, categories);

  const categoryChips = useMemo<ChipOption[]>(() => [
    { label: 'All', value: 'all' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
  ], [categories]);

  // Goals
  const onTrack = useMemo(() => {
    return tripTargets.filter((t) => {
      const cur = tripActivities.filter((a) => a.categoryId === t.categoryId).reduce((s, a) => s + a.metric, 0);
      return cur >= t.targetValue;
    }).length;
  }, [tripTargets, tripActivities]);

  // Insights
  const { barChartData, lineChartData, categoryBarData, progressData } = useInsightsData(viewMode);
  const categoryLookup = useCategoryLookup(categories);
  const streaks = useMemo(() => computeStreaks(tripActivities, tripTargets, categoryLookup), [tripActivities, tripTargets, categoryLookup]);

  const noResults = isFiltered && filtered.length === 0;

  return (
    <ScreenContainer>
      {/* Trip summary */}
      <Text style={[styles.tripMeta, { color: theme.textSecondary }]}>
        {trip?.destination} · {completed}/{tripActivities.length} done
      </Text>

      {/* Segment toggle */}
      <View style={[styles.segmentRow, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        {(['activities', 'goals', 'insights'] as Section[]).map((s) => (
          <Pressable
            key={s}
            style={[styles.segment, section === s && { backgroundColor: Palette.coral }]}
            onPress={() => setSection(s)}
            accessibilityRole="tab"
            accessibilityLabel={`${s.charAt(0).toUpperCase() + s.slice(1)} tab`}
            accessibilityState={{ selected: section === s }}
          >
            <Text style={[styles.segmentText, { color: section === s ? Palette.white : theme.textSecondary }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* === Activities === */}
      {section === 'activities' && (
        <>
          {trip && <TripInfoBar city={trip.destination} country={trip.country} />}
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search activities..." suggestions={categories.slice(0, 4).map((c) => c.name)} />
          <FilterChips options={categoryChips} selected={selectedCategory} onSelect={setSelectedCategory} accessibilityLabel="Filter by category" />
          {noResults ? (
            <EmptyState title="No results" message="Try a different search." actionLabel="Clear filters" onAction={resetFilters} />
          ) : (
            <ActivityList activities={filtered} categories={categories} />
          )}
          <FAB onPress={() => router.push('/activity/add')} accessibilityLabel="Log activity" />
        </>
      )}

      {/* === Goals === */}
      {section === 'goals' && (
        <>
          <SummaryBanner onTrack={onTrack} total={tripTargets.length} />
          {tripTargets.length === 0 ? (
            <EmptyState title="No goals yet" message="Set targets to track your trip progress." actionLabel="Add Goal" onAction={() => router.push('/target/add')} />
          ) : (
            <TargetList targets={tripTargets} categories={categories} activities={tripActivities} />
          )}
          <FAB onPress={() => router.push('/target/add')} icon="flag" accessibilityLabel="Add goal" />
        </>
      )}

      {/* === Insights === */}
      {section === 'insights' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <StatsRow stats={[
            { label: 'Total', value: `${tripActivities.reduce((s, a) => s + a.metric, 0)}m`, icon: 'time' },
            { label: 'Activities', value: String(tripActivities.length), icon: 'list' },
            { label: 'Goals', value: String(tripTargets.length), icon: 'flag' },
          ]} />
          <ViewModeToggle selected={viewMode} onSelect={setViewMode} />
          <BarChartCard title={`Totals (${viewMode})`} data={barChartData} />
          <LineChartCard title="Trend" data={lineChartData} />

          <Text style={[SharedStyles.sectionTitle, { color: theme.textPrimary }]}>Streaks</Text>
          {streaks.length > 0 ? streaks.map((s) => <StreakCard key={s.categoryId} streak={s} />) : (
            <EmptyState title="No streaks" message="Log on consecutive days to build streaks." showAnimation={false} />
          )}
          <View style={styles.spacer} />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tripMeta: { fontSize: 13, marginBottom: Spacing.md },
  segmentRow: { borderRadius: BorderRadius.sm, borderWidth: 1, flexDirection: 'row', marginBottom: Spacing.lg, overflow: 'hidden' },
  segment: { alignItems: 'center', flex: 1, paddingVertical: Spacing.md },
  segmentText: { fontSize: 13, fontWeight: '700' },
  spacer: { height: Spacing.xxxl },
});
