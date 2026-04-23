import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useActivities, useAppTheme, useHaptics, useNotifications } from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { ScreenContainer, ScreenHeader, DecorativeCircles } from '@/components/layout';
import { CreateTripCard, CREATE_TRIP_SENTINEL, TripCard } from '@/components/cards';
import { PressableOpacity } from '@/components/buttons';
import type { CreateTripSentinel } from '@/components/cards';
import { EmptyState, NotificationsPanel } from '@/components/feedback';
import { BorderRadius, Shadows, Spacing, Palette } from '@/constants';
import { isPastTrip } from '@/utils/dateHelpers';
import type { Trip } from '@/types';

const LOGO_LIGHT = require('@/assets/images/logo/transparent-logo-light.png');
const LOGO_DARK = require('@/assets/images/logo/transparent-logo-dark.png');

const CARD_SPACING = Spacing.md;
// Peek: how much of the neighbour card is visible on each side. Sized so a
// meaningful slice of the next trip's cover image is on-screen (not just a
// sliver), which reads more clearly as "there's another trip over there" and
// invites the swipe gesture.
const PEEK_AMOUNT = 48;
const SIDE_PADDING = PEEK_AMOUNT + CARD_SPACING;

export default function TripsScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { activities } = useActivities();
  const theme = useAppTheme();
  const { isDark } = useThemeControl();
  const haptics = useHaptics();
  const { notifications, dismiss, clearAll } = useNotifications();
  // Reactive to orientation changes (vs. cached Dimensions.get at module load)
  // so the carousel reflows if the device rotates.
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SIDE_PADDING * 2;
  const snapInterval = cardWidth + CARD_SPACING;
  // Previous trips rail uses narrower cards - they're a secondary surface,
  // so the rail fits ~2 cards on-screen to invite horizontal swiping.
  const previousCardWidth = Math.round(screenWidth * 0.55);
  const [activeIndex, setActiveIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Cap the visible badge so "99+" doesn't blow out the pill width - in
  // practise we should never reach it, but the bound is cheap insurance.
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
  // and "past" (exposed via the View Past Trips entry below, which opens
  // the dedicated /trips/past archive screen). The split is a pure
  // derivation so a user logging a new past activity doesn't need to
  // re-open the tab to see the count update.
  const { plannedTrips, previousTrips } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const planned: Trip[] = [];
    const past: Trip[] = [];
    for (const t of trips) {
      if (isPastTrip(t.endDate)) past.push(t);
      else planned.push(t);
    }
    // Planned: in-progress first, then soonest start first.
    planned.sort((a, b) => {
      const aInProgress = a.startDate <= today;
      const bInProgress = b.startDate <= today;
      if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
      return a.startDate.localeCompare(b.startDate);
    });
    // Past: most-recently-ended first so the freshest memory leads.
    past.sort((a, b) => b.endDate.localeCompare(a.endDate));
    return { plannedTrips: planned, previousTrips: past };
  }, [trips]);

  // Carousel data - the create-trip placeholder always leads so the
  // add-new affordance sits at a predictable spot (first swipe). Using a
  // discriminated union lets the renderItem branch by `__kind` without
  // sprinkling sentinel checks throughout the file.
  type PlannedItem = CreateTripSentinel | Trip;
  const plannedItems = useMemo<PlannedItem[]>(
    () => [CREATE_TRIP_SENTINEL, ...plannedTrips],
    [plannedTrips],
  );

  const renderPlannedItem = useCallback(
    ({ item }: { item: PlannedItem }) => {
      if ('__kind' in item) {
        return (
          <View style={styles.cardWrapper}>
            <CreateTripCard
              width={cardWidth}
              onPress={() => {
                haptics.light();
                router.push('/trip/add');
              }}
            />
          </View>
        );
      }
      const stats = tripStats.get(item.id);
      return (
        <View style={styles.cardWrapper}>
          <TripCard
            trip={item}
            width={cardWidth}
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
    },
    [tripStats, router, haptics, cardWidth],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
      // Functional updater keeps this callback stable across renders - the
      // FlatList doesn't reattach its onScroll listener every time the
      // active index changes.
      setActiveIndex((prev) => (idx !== prev ? idx : prev));
    },
    [snapInterval],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PlannedItem> | null | undefined, index: number) => ({
      length: snapInterval,
      offset: snapInterval * index,
      index,
    }),
    [snapInterval],
  );

  const plannedKeyExtractor = useCallback(
    (item: PlannedItem) => ('__kind' in item ? 'create' : item.id.toString()),
    [],
  );

  const hasAnyTrips = plannedTrips.length > 0 || previousTrips.length > 0;

  const renderPreviousItem = useCallback(
    ({ item }: { item: Trip }) => {
      const stats = tripStats.get(item.id);
      return (
        <View style={styles.previousCardWrapper}>
          <TripCard
            trip={item}
            width={previousCardWidth}
            activityCount={stats?.total ?? 0}
            completedCount={stats?.completed ?? 0}
            muted
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
    [tripStats, router, previousCardWidth],
  );

  return (
    <ScreenContainer withTabs>
      <DecorativeCircles opacity={0.06} />
      {/* Integrated header row - no opaque nav bar above. The title sits
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
        <PressableOpacity
          onPress={handleOpenNotifications}
          style={styles.bellButton}
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
            size={24}
            color={theme.textPrimary}
          />
          {badgeCount > 0 ? (
            // Numbered coral pip - the count is short so it fits a small
            // pill; we position it absolutely so the bell icon stays
            // centred regardless of badge state. No border ring now that
            // the bell sits on the bare background.
            <View
              style={[styles.badge, { backgroundColor: theme.accentAction }]}
              accessible={false}
              importantForAccessibility="no"
            >
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </PressableOpacity>
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
          contentContainerStyle={styles.scrollContent}
          // Lock scroll to one axis at a time - helps the native scroll
          // view classify mostly-vertical drags quickly so they don't
          // stall while competing with the horizontal FlatList children.
          directionalLockEnabled
          // Android equivalent: opt into the nested-scroll protocol so
          // gestures can be handed off between this ScrollView and its
          // horizontal FlatList children instead of being captured outright.
          nestedScrollEnabled
          // Native iOS/Android pattern - dragging to scroll dismisses the
          // keyboard. Replaces the old tap-on-background dismiss that came
          // from the now-removed TouchableWithoutFeedback wrapper in
          // ScreenContainer (which was intercepting empty-space scroll).
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <FlatList
            data={plannedItems}
            keyExtractor={plannedKeyExtractor}
            renderItem={renderPlannedItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            snapToAlignment="start"
            decelerationRate="fast"
            style={styles.flatList}
            contentContainerStyle={styles.list}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={getItemLayout}
            ItemSeparatorComponent={plannedSeparator}
            // Only claim gestures that are predominantly horizontal -
            // releases mostly-vertical drags to the parent ScrollView
            // so the user can swipe up/down through the page even when
            // their finger starts on a trip card.
            directionalLockEnabled
            nestedScrollEnabled
          />

          {/* One dot per carousel item - including the create card at
              position 0. Keeping dots aligned with `plannedItems` means
              the active indicator tracks the scroll position directly,
              which is what the user expects when swiping through. */}
          <View
            style={styles.dots}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={
              activeIndex === 0
                ? 'Create trip card'
                : `Trip ${activeIndex} of ${plannedTrips.length}`
            }
          >
            {plannedItems.map((item, i) => {
              const isActive = i === activeIndex;
              const key = '__kind' in item ? 'create' : item.id;
              return (
                <View
                  key={key}
                  accessible={false}
                  importantForAccessibility="no"
                  style={[
                    styles.dot,
                    { backgroundColor: isActive ? Palette.coral : theme.cardBorder },
                    isActive && styles.dotActive,
                  ]}
                />
              );
            })}
          </View>

          {previousTrips.length > 0 ? (
            <View style={styles.previousSection}>
              <View style={styles.previousHeader}>
                <Text style={[styles.previousTitle, { color: theme.textPrimary }]}>
                  Previous Trips
                </Text>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    router.push('/trips/past');
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="See all past trips"
                >
                  {({ pressed }) => (
                    <Text
                      style={[
                        styles.previousSeeAll,
                        { color: theme.accentAction, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      See all ({previousTrips.length})
                    </Text>
                  )}
                </Pressable>
              </View>
              <FlatList
                data={previousTrips}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPreviousItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previousList}
                ItemSeparatorComponent={plannedSeparator}
                directionalLockEnabled
                nestedScrollEnabled
              />
            </View>
          ) : (
            <View style={styles.previousSection}>
              <View style={styles.previousHeader}>
                <Text style={[styles.previousTitle, { color: theme.textPrimary }]}>
                  Previous Trips
                </Text>
              </View>
              <View
                style={[
                  styles.previousEmpty,
                  { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                ]}
                accessible
                accessibilityRole="summary"
                accessibilityLabel="No past trips yet. Plan your first trip to start building your travel history."
              >
                <Image
                  source={isDark ? LOGO_DARK : LOGO_LIGHT}
                  style={styles.previousEmptyLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.previousEmptyTitle, { color: theme.textPrimary }]}>
                  No past trips yet
                </Text>
                <Text style={[styles.previousEmptySub, { color: theme.textSecondary }]}>
                  Your completed adventures will land here. Plan your next trip and we’ll track the memories.
                </Text>
                <PressableOpacity
                  onPress={() => {
                    haptics.light();
                    router.push('/trip/add');
                  }}
                  pressedOpacity={0.85}
                  style={[styles.previousEmptyCta, { backgroundColor: theme.accentAction }]}
                  accessibilityRole="button"
                  accessibilityLabel="Plan a trip"
                  accessibilityHint="Opens the create trip screen"
                >
                  <Ionicons name="add" size={18} color={Palette.white} />
                  <Text style={styles.previousEmptyCtaText}>Plan a trip</Text>
                </PressableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

    </ScreenContainer>
  );
}

// Hoisted so the FlatList doesn't receive a new function identity on
// every render of TripsScreen - keeps separators cheap.
const plannedSeparator = () => <View style={{ width: CARD_SPACING }} />;

const styles = StyleSheet.create({
  // Top row - title on the left, theme toggle on the right. Using a
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
    height: 40,
    justifyContent: 'center',
    marginTop: Spacing.xs,
    width: 40,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeText: {
    color: Palette.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // `flexGrow: 0` stops the horizontal FlatList from stretching to fill its
  // column parent - without it, RN pushes the list to take all remaining
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
    paddingBottom: Spacing.xxxl,
  },
  // Previous trips inline rail - titled section with a horizontal FlatList
  // of muted TripCards underneath. "See all" link on the right opens the
  // full /trips/past archive.
  previousSection: {
    marginTop: Spacing.xl,
  },
  previousHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  previousTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  previousSeeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  previousList: {
    paddingVertical: Spacing.xs,
  },
  previousCardWrapper: {
    // TripCard receives width via prop; wrapper just groups children.
  },

  // Empty-state card shown when the user has no past trips yet. Mirrors
  // the card surface vocabulary used elsewhere (bordered, soft shadow)
  // so it sits naturally below the planned carousel.
  previousEmpty: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    ...Shadows.sm,
  },
  previousEmptyLogo: {
    height: 48,
    marginBottom: Spacing.md,
    width: 170,
  },
  previousEmptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  previousEmptySub: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  previousEmptyCta: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  previousEmptyCtaText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
