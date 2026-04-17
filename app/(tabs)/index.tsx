import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrips, useActivities, useAppTheme } from '@/hooks';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { TripCard } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing, Palette } from '@/constants';
import type { Trip } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SPACING = Spacing.md;
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - CARD_SPACING * 2;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

export default function TripsScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { activities } = useActivities();
  const theme = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);

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

  const renderItem = useCallback(({ item }: { item: Trip }) => {
    const stats = tripStats.get(item.id);
    return (
      <View style={styles.cardWrapper}>
        <TripCard
          trip={item}
          width={CARD_WIDTH}
          activityCount={stats?.total ?? 0}
          completedCount={stats?.completed ?? 0}
          onPress={() => router.push({ pathname: '/trip/[id]/activities', params: { id: item.id.toString() } })}
        />
      </View>
    );
  }, [tripStats, router]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    if (idx !== activeIndex) setActiveIndex(idx);
  }, [activeIndex]);

  const getItemLayout = useCallback(
    (_: ArrayLike<Trip> | null | undefined, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  return (
    <ScreenContainer withTabs>
      <ScreenHeader
        title="My Trips"
        subtitle={trips.length > 0 ? `Swipe to explore your ${trips.length} trip${trips.length === 1 ? '' : 's'}` : 'Plan your first adventure'}
      />

      {trips.length === 0 ? (
        <EmptyState
          title="No trips yet"
          message="Create your first trip to start planning your holiday activities, setting goals, and tracking your adventures."
          actionLabel="Create Trip"
          onAction={() => router.push('/trip/add')}
        />
      ) : (
        <>
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.list}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={getItemLayout}
            ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
          />

          <View
            style={styles.dots}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Trip ${activeIndex + 1} of ${trips.length}`}
          >
            {trips.map((t, i) => (
              <View
                key={t.id}
                accessible={false}
                importantForAccessibility="no"
                style={[
                  styles.dot,
                  { backgroundColor: i === activeIndex ? Palette.coral : theme.cardBorder },
                  i === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </>
      )}

      <FAB onPress={() => router.push('/trip/add')} accessibilityLabel="Create new trip" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cardWrapper: {
    // TripCard receives width via prop; wrapper just groups children.
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    width: 24,
  },
});
