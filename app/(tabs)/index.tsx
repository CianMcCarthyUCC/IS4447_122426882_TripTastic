import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useActivities, useAppTheme, useHaptics, useNotifications } from '@/hooks';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { TripCard } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState, NotificationsPanel } from '@/components/feedback';
import { BorderRadius, Shadows, Spacing, Palette } from '@/constants';
import type { Trip } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SPACING = Spacing.md;
// Peek: how much of the neighbour card is visible on each side. Sized so a
// meaningful slice of the next trip's cover image is on-screen (not just a
// sliver), which reads more clearly as "there's another trip over there" and
// invites the swipe gesture.
const PEEK_AMOUNT = 48;
const SIDE_PADDING = PEEK_AMOUNT + CARD_SPACING;
const CARD_WIDTH = SCREEN_WIDTH - SIDE_PADDING * 2;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

// Past trips render smaller in a secondary rail below the main carousel —
// visual hierarchy says "look back, not the main event". ~55% of screen
// keeps the 3:4 aspect readable without dominating.
const PREVIOUS_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.55);

export default function TripsScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { activities } = useActivities();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { notifications, dismiss, clearAll } = useNotifications();
  const [activeIndex, setActiveIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Cap the visible badge so "99+" doesn't blow out the pill width — in
  // practice we should never reach it, but the bound is cheap insurance.
  const badgeCount = notifications.length;
  const badgeLabel = badgeCount > 9 ? '9+' : String(badgeCount);

  const handleOpenNotifications = () => {
    haptics.light();
    setNotificationsOpen(true);
  };

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

  // Split trips into "upcoming / in-progress" (shown in the main carousel)
  // and "past" (shown in the Previous Trips rail below). An end date
  // strictly before today means the trip is over. The split is a pure
  // derivation so a user logging a new past activity doesn't need to
  // re-open the tab to see the sections update.
  const { plannedTrips, previousTrips } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const planned: Trip[] = [];
    const previous: Trip[] = [];
    for (const t of trips) {
      if (t.endDate < today) previous.push(t);
      else planned.push(t);
    }
    // Planned: in-progress first, then soonest start first.
    planned.sort((a, b) => {
      const aInProgress = a.startDate <= today;
      const bInProgress = b.startDate <= today;
      if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
      return a.startDate.localeCompare(b.startDate);
    });
    // Previous: most recently ended first — reading order matches recency.
    previous.sort((a, b) => b.endDate.localeCompare(a.endDate));
    return { plannedTrips: planned, previousTrips: previous };
  }, [trips]);

  const renderPlannedItem = useCallback(({ item }: { item: Trip }) => {
    const stats = tripStats.get(item.id);
    return (
      <View style={styles.cardWrapper}>
        <TripCard
          trip={item}
          width={CARD_WIDTH}
          activityCount={stats?.total ?? 0}
          completedCount={stats?.completed ?? 0}
          onPress={() =>
            router.push({
              pathname: '/trip/[id]/activities',
              params: { id: item.id.toString() },
            })
          }
        />
      </View>
    );
  }, [tripStats, router]);

  const renderPreviousItem = useCallback(({ item }: { item: Trip }) => {
    const stats = tripStats.get(item.id);
    return (
      <View style={styles.cardWrapper}>
        <TripCard
          trip={item}
          width={PREVIOUS_CARD_WIDTH}
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
  }, [tripStats, router]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    // Functional updater keeps this callback stable across renders — the
    // FlatList doesn't reattach its onScroll listener every time the
    // active index changes.
    setActiveIndex((prev) => (idx !== prev ? idx : prev));
  }, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Trip> | null | undefined, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  const hasAnyTrips = plannedTrips.length > 0 || previousTrips.length > 0;

  return (
    <ScreenContainer withTabs>
      {/* Integrated header row — no opaque nav bar above. The title sits
          directly on the screen background so cards feel continuous with
          the page, and a circular theme toggle floats on the right side
          (same pattern as the reference screenshots). */}
      <View style={styles.topRow}>
        <View style={styles.headerBlock}>
          <ScreenHeader
            title="Planned Trips"
            subtitle={
              plannedTrips.length > 0
                ? `Swipe to explore your ${plannedTrips.length} trip${plannedTrips.length === 1 ? '' : 's'}`
                : 'Plan your next adventure'
            }
          />
        </View>
        <Pressable
          onPress={handleOpenNotifications}
          style={({ pressed }) => [
            styles.bellButton,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            badgeCount === 0
              ? 'Open notifications'
              : `Open notifications, ${badgeCount} new`
          }
          hitSlop={8}
        >
          <Ionicons
            name={badgeCount > 0 ? 'notifications' : 'notifications-outline'}
            size={20}
            color={theme.textPrimary}
          />
          {badgeCount > 0 ? (
            // Numbered coral pip — the count is short so it fits a small
            // pill; we position it absolutely so the bell icon stays
            // centred in the button regardless of badge state.
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.accentAction,
                  borderColor: theme.cardBackground,
                },
              ]}
              accessible={false}
              importantForAccessibility="no"
            >
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <NotificationsPanel
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onDismiss={dismiss}
        onClearAll={clearAll}
      />

      {!hasAnyTrips ? (
        <EmptyState
          title="No trips yet"
          message="Create your first trip to start planning your holiday activities, setting goals, and tracking your adventures."
          actionLabel="Create Trip"
          onAction={() => router.push('/trip/add')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          // Leaves room so the FAB never sits on top of the last previous
          // card when the user scrolls all the way down.
          contentContainerStyle={styles.scrollContent}
          // Lock scroll to one axis at a time — helps the native scroll
          // view classify mostly-vertical drags quickly so they don't
          // stall while competing with the horizontal FlatList children.
          directionalLockEnabled
          // Android equivalent: opt into the nested-scroll protocol so
          // gestures can be handed off between this ScrollView and its
          // horizontal FlatList children instead of being captured outright.
          nestedScrollEnabled
          // Native iOS/Android pattern — dragging to scroll dismisses the
          // keyboard. Replaces the old tap-on-background dismiss that came
          // from the now-removed TouchableWithoutFeedback wrapper in
          // ScreenContainer (which was intercepting empty-space scroll).
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {plannedTrips.length > 0 ? (
            <>
              <FlatList
                data={plannedTrips}
                keyExtractor={keyExtractor}
                renderItem={renderPlannedItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                style={styles.flatList}
                contentContainerStyle={styles.list}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                ItemSeparatorComponent={plannedSeparator}
                // Only claim gestures that are predominantly horizontal —
                // releases mostly-vertical drags to the parent ScrollView
                // so the user can swipe up/down through the page even when
                // their finger starts on a trip card.
                directionalLockEnabled
                nestedScrollEnabled
              />

              <View
                style={styles.dots}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={`Trip ${activeIndex + 1} of ${plannedTrips.length}`}
              >
                {plannedTrips.map((t, i) => (
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
          ) : (
            <View
              style={[
                styles.noPlannedCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <Ionicons name="airplane-outline" size={24} color={theme.textSecondary} />
              <Text style={[styles.noPlannedTitle, { color: theme.textPrimary }]}>
                No upcoming trips
              </Text>
              <Text style={[styles.noPlannedHint, { color: theme.textSecondary }]}>
                Tap New Trip to plan your next one.
              </Text>
            </View>
          )}

          {previousTrips.length > 0 ? (
            <View style={styles.previousSection}>
              <Text style={[styles.previousTitle, { color: theme.textPrimary }]}>
                Previous Trips
              </Text>
              <Text style={[styles.previousSubtitle, { color: theme.textSecondary }]}>
                Look back on past trips
              </Text>
              <FlatList
                data={previousTrips}
                keyExtractor={keyExtractor}
                renderItem={renderPreviousItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.previousList}
                contentContainerStyle={styles.previousListContent}
                ItemSeparatorComponent={previousSeparator}
                // Same gesture contract as the planned carousel above —
                // vertical drags fall through to the outer ScrollView.
                directionalLockEnabled
                nestedScrollEnabled
              />
            </View>
          ) : null}
        </ScrollView>
      )}

      <FAB onPress={() => router.push('/trip/add')} label="New Trip" accessibilityLabel="Create new trip" />
    </ScreenContainer>
  );
}

// Hoisted so the FlatList doesn't receive a new function identity on
// every render of TripsScreen — keeps separators + keys cheap.
const keyExtractor = (item: Trip) => item.id.toString();
const plannedSeparator = () => <View style={{ width: CARD_SPACING }} />;
const previousSeparator = () => <View style={{ width: Spacing.md }} />;

const styles = StyleSheet.create({
  // Top row — title on the left, theme toggle on the right. Using a
  // flex row rather than absolute positioning keeps the toggle aligned
  // with the ScreenHeader's baseline and avoids overlap on narrow widths.
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerBlock: {
    flex: 1,
  },
  bellButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginTop: Spacing.xs,
    width: 44,
    ...Shadows.sm,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // `flexGrow: 0` stops the horizontal FlatList from stretching to fill its
  // column parent — without it, RN pushes the list to take all remaining
  // vertical space, which leaves a huge dead zone between the cards and
  // anything rendered below the list.
  flatList: {
    flexGrow: 0,
    // Break out of the screen's horizontal padding so the card strip
    // reaches the true screen edge. The list's own `contentContainerStyle`
    // reinstates a symmetrical inner gutter via `paddingHorizontal`. This
    // makes the trips page feel continuous with the device edge rather
    // than boxed in by the tab-screen margins.
    marginHorizontal: -Spacing.lg,
  },
  list: {
    // Equal, small gutters on both ends so neither the first nor the last
    // card has a large empty strip next to it. FlatList clamps scroll at the
    // content boundary, so the last card lands with the previous card peeking
    // strongly on the left, mirroring the first card's initial state.
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  cardWrapper: {
    // TripCard receives width via prop; wrapper just groups children.
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    width: 24,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl * 2, // clear the FAB
  },
  previousSection: {
    marginTop: Spacing.xl,
  },
  previousTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  previousSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  previousList: {
    flexGrow: 0,
    // Same trick as the planned carousel: break out of the screen gutter
    // so past-trip cards reach the device edge.
    marginHorizontal: -Spacing.lg,
  },
  previousListContent: {
    paddingHorizontal: Spacing.lg,
  },
  noPlannedCard: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  noPlannedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  noPlannedHint: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
