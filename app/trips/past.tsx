import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrips, useActivities } from '@/hooks';
import { ScreenContainer, PageHeader, DecorativeCircles } from '@/components/layout';
import { CreateTripCard, TripCard } from '@/components/cards';
import { Spacing } from '@/constants';
import { isPastTrip } from '@/utils/dateHelpers';
import type { Trip } from '@/types';

/**
 * The Past Trips archive - a full list of every trip the user has
 * finished. Tapping a trip opens its read-only recap screen.
 */
export default function PastTripsScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { activities } = useActivities();
  const { width: screenWidth } = useWindowDimensions();

  const tripStats = useMemo(() => {
    const map = new Map<number, { total: number; completed: number }>();
    for (const a of activities) {
      const current = map.get(a.tripId) ?? { total: 0, completed: 0 };
      current.total++;
      if (a.status === 'completed') current.completed++;
      map.set(a.tripId, current);
    }
    return map;
  }, [activities]);

  const previousTrips = useMemo(() => {
    // Reuses the same rule as the Trips tab (endDate < today, most
    // recently ended first) so the archive never disagrees with the
    // entry-point count on the home screen.
    return trips
      .filter((t) => isPastTrip(t.endDate))
      .sort((a, b) => b.endDate.localeCompare(a.endDate));
  }, [trips]);

  const renderItem = useCallback(
    ({ item }: { item: Trip }) => {
      const stats = tripStats.get(item.id);
      return (
        <View style={styles.cardRow}>
          <TripCard
            trip={item}
            muted
            activityCount={stats?.total ?? 0}
            completedCount={stats?.completed ?? 0}
            onPress={() =>
              router.push({
                pathname: '/trip/[id]/past',
                params: { id: item.id.toString() },
              })
            }
          />
        </View>
      );
    },
    [tripStats, router],
  );

  // Cap the empty-state card's width so it reads as a portrait poster
  // on phones rather than stretching edge to edge on a tablet.
  const emptyCardWidth = Math.min(screenWidth - Spacing.xxl * 2, 340);

  return (
    <ScreenContainer withTabs>
      <DecorativeCircles opacity={0.06} />
      <PageHeader title="Past Trips" />

      {previousTrips.length === 0 ? (
        <View style={styles.emptyWrap}>
          <CreateTripCard
            width={emptyCardWidth}
            title="No past trips yet"
            helper="Create your first trip"
            accessibilityLabel="Create a new trip"
            onPress={() => router.push('/trip/add')}
          />
        </View>
      ) : (
        <FlatList
          data={previousTrips}
          keyExtractor={(t) => t.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={separator}
        />
      )}
    </ScreenContainer>
  );
}

const separator = () => <View style={{ height: Spacing.md }} />;

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  cardRow: {
    // TripCard's built-in aspect ratio (3:4) produces a tall portrait
    // card - that's the intent on the list. No wrapper size override.
  },
  emptyWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
  },
});
