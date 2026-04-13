import { useMemo, useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActivities, useCategories, useAppTheme, useHaptics, useFilteredActivities, useTrips } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { ActivityList } from '@/components/lists';
import { SearchBar, FilterChips } from '@/components/forms';
import { TripInfoBar } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';

export default function IndexScreen() {
  const router = useRouter();
  const { activities } = useActivities();
  const { categories } = useCategories();
  const { trips, currentTrip, selectTrip } = useTrips();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const [showSearch, setShowSearch] = useState(false);

  const tripActivities = useMemo(
    () => currentTrip ? activities.filter((a) => a.tripId === currentTrip.id) : activities,
    [activities, currentTrip],
  );

  const {
    filtered, searchQuery, selectedCategory,
    setSearchQuery, setSelectedCategory,
    resetFilters, isFiltered, activeFilterCount,
  } = useFilteredActivities(tripActivities, categories);

  const categoryChips = useMemo<ChipOption[]>(() => [
    { label: 'All', value: 'all' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
  ], [categories]);

  const searchSuggestions = useMemo(() => categories.slice(0, 4).map((c) => c.name), [categories]);
  const noResults = isFiltered && filtered.length === 0;
  const completed = useMemo(() => filtered.filter((a) => a.status === 'completed').length, [filtered]);

  return (
    <ScreenContainer withTabs>
      {/* Clean header — trip name + quick actions */}
      {currentTrip && (
        <View style={styles.header}>
          <Pressable
            style={styles.tripSelector}
            onPress={() => router.push({ pathname: '/trip/[id]', params: { id: currentTrip.id.toString() } })}
            accessibilityLabel="View trip details"
            accessibilityRole="button"
          >
            <Text style={[styles.tripName, { color: theme.textPrimary }]}>{currentTrip.name}</Text>
            <Text style={[styles.tripMeta, { color: theme.textSecondary }]}>
              {currentTrip.destination} · {completed}/{filtered.length} done
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowSearch(!showSearch)}
            accessibilityLabel="Toggle search"
            accessibilityRole="button"
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Trip switcher — compact horizontal scroll */}
      {trips.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripScroll} contentContainerStyle={styles.tripScrollContent}>
          {trips.map((t) => {
            const active = currentTrip?.id === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => { selectTrip(t.id); haptics.light(); }}
                style={[styles.tripChip, active && { borderColor: Palette.coral }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.name}
              >
                {t.coverImage ? (
                  <Image source={{ uri: t.coverImage }} style={styles.tripThumb} />
                ) : (
                  <View style={[styles.tripThumb, { backgroundColor: theme.tagBackground }]}>
                    <Ionicons name="airplane" size={14} color={theme.textSecondary} />
                  </View>
                )}
                <Text style={[styles.tripChipText, { color: active ? Palette.coral : theme.textSecondary }]} numberOfLines={1}>
                  {t.name.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => router.push('/trip/add')}
            style={styles.tripChip}
            accessibilityLabel="Add trip"
            accessibilityRole="button"
          >
            <View style={[styles.tripThumb, { backgroundColor: theme.tagBackground }]}>
              <Ionicons name="add" size={18} color={Palette.coral} />
            </View>
            <Text style={[styles.tripChipText, { color: theme.textSecondary }]}>New</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Cover image */}
      {currentTrip?.coverImage && (
        <Image source={{ uri: currentTrip.coverImage }} style={styles.cover} />
      )}

      {/* Collapsible search + filters */}
      {showSearch && (
        <>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search activities..." suggestions={searchSuggestions} />
          <FilterChips options={categoryChips} selected={selectedCategory} onSelect={setSelectedCategory} accessibilityLabel="Filter by category" />
        </>
      )}

      {/* Weather/country bar — slim */}
      {currentTrip && !showSearch && (
        <TripInfoBar city={currentTrip.destination} country={currentTrip.country} />
      )}

      {/* Activity feed */}
      {noResults ? (
        <EmptyState
          title="No results"
          message={searchQuery ? `Nothing matches "${searchQuery}".` : 'No activities match your filters.'}
          suggestions={searchSuggestions}
          onSuggestionPress={setSearchQuery}
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <ActivityList activities={filtered} categories={categories} />
      )}

      <FAB onPress={() => router.push('/activity/add')} accessibilityLabel="Log activity" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  tripSelector: {
    flex: 1,
  },
  tripName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tripMeta: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  tripScroll: {
    marginBottom: Spacing.md,
  },
  tripScrollContent: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  tripChip: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    padding: Spacing.xs,
    width: 68,
  },
  tripThumb: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  tripChipText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  cover: {
    borderRadius: BorderRadius.md,
    height: 140,
    marginBottom: Spacing.md,
    width: '100%',
    ...Shadows.sm,
  },
});
