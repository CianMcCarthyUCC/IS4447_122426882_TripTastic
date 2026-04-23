import { useCallback, useMemo } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuth,
  useToast,
  useHaptics,
  useAppTheme,
  useActivities,
  useTargets,
  useTrips,
} from '@/hooks';
import { PrimaryButton, PressableOpacity } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenContainer, DecorativeCircles } from '@/components/layout';
import { TripCard, CreateTripCard } from '@/components/cards';
import { Avatar } from '@/components/Avatar';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { formatIsoDate, isPastTrip } from '@/utils/dateHelpers';
import type { Trip } from '@/types';

const CARD_SPACING = Spacing.md;
// Peek amount mirrors the Trips tab so the carousel feels consistent across
// surfaces - a slice of the next card invites the swipe gesture.
const PEEK_AMOUNT = 48;
const SIDE_PADDING = PEEK_AMOUNT + CARD_SPACING;

/**
 * The Profile tab. Shows the user's avatar, name and a quick snapshot
 * of their trips, activities and goals, with a gear icon in the corner
 * that opens the full Settings screen.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activities } = useActivities();
  const { targets } = useTargets();
  const { trips } = useTrips();
  const { toast, hideToast } = useToast();
  const haptics = useHaptics();
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SIDE_PADDING * 2;

  // Derived display bits - stable across renders thanks to useMemo; we fall
  // back to the email's local part when the user hasn't filled in a display
  // name yet so the hero never looks empty on first visit.
  const displayName = useMemo(() => {
    if (!user) return '';
    const trimmed = user.displayName?.trim();
    if (trimmed) return trimmed;
    return user.email.split('@')[0];
  }, [user]);

  const memberSince = useMemo(
    () => (user ? formatIsoDate(user.createdAt, 'monthYear') : ''),
    [user],
  );

  // Planned (current/upcoming) trips feed the carousel - past trips stay on
  // the Trips tab's dedicated archive, so they're hidden here.
  const plannedTrips = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trips
      .filter((t) => !isPastTrip(t.endDate))
      .sort((a, b) => {
        const aInProgress = a.startDate <= today;
        const bInProgress = b.startDate <= today;
        if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
        return a.startDate.localeCompare(b.startDate);
      });
  }, [trips]);

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

  const renderTrip = useCallback(
    ({ item }: { item: Trip }) => {
      const stats = tripStats.get(item.id);
      return (
        <View style={{ marginRight: CARD_SPACING }}>
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
    [cardWidth, router, tripStats],
  );

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={[styles.missingTitle, { color: theme.textPrimary }]}>Not signed in</Text>
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <DecorativeCircles opacity={0.06} />
      <Toast {...toast} onHide={hideToast} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Top bar ─────────────────────────────────────────
            Settings gear anchored to the right - Instagram's "Settings
            and activity" entry point. */}
        <View style={styles.topBar}>
          <PressableOpacity
            onPress={() => {
              haptics.light();
              router.push('/settings');
            }}
            hitSlop={12}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
          </PressableOpacity>
        </View>

        {/* ── Hero ────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Avatar
              uri={user.profilePicture}
              displayName={displayName}
              email={user.email}
              size={96}
            />
          </View>

          <Text
            style={[styles.heroName, { color: theme.textPrimary }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {displayName}
          </Text>
          <Text
            style={[styles.heroEmail, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {user.email}
          </Text>

          {user.homeCity ? (
            <View style={styles.heroMetaRow}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.heroMeta, { color: theme.textSecondary }]}>
                {user.homeCity}
              </Text>
              <Text style={[styles.heroMetaDot, { color: theme.textSecondary }]}>·</Text>
              <Text style={[styles.heroMeta, { color: theme.textSecondary }]}>
                Joined {memberSince}
              </Text>
            </View>
          ) : (
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.heroMeta, { color: theme.textSecondary }]}>
                Joined {memberSince}
              </Text>
            </View>
          )}

          <PressableOpacity
            onPress={() => {
              haptics.light();
              router.push('/edit-profile');
            }}
            pressedOpacity={0.85}
            style={[styles.editPill, { backgroundColor: theme.accentAction }]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="create-outline" size={16} color={Palette.white} />
            <Text style={styles.editPillText}>Edit Profile</Text>
          </PressableOpacity>
        </View>

        {/* ── Stats strip ─────────────────────────────────── */}
        <View style={[styles.statsRow, { borderColor: theme.cardBorder }]}>
          <StatChip icon="airplane" label="Trips" value={trips.length} theme={theme} />
          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
          <StatChip
            icon="checkmark-done"
            label="Activities"
            value={activities.length}
            theme={theme}
          />
          <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
          <StatChip icon="flag" label="Goals" value={targets.length} theme={theme} />
        </View>

        {/* ── Your Trips ──────────────────────────────────── */}
        <View style={styles.tripsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Trips</Text>
          {plannedTrips.length === 0 ? (
            <View style={styles.emptyTripsWrap}>
              <CreateTripCard
                width={cardWidth}
                onPress={() => {
                  haptics.light();
                  router.push('/trip/add');
                }}
              />
            </View>
          ) : (
            <FlatList
              data={plannedTrips}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTrip}
              contentContainerStyle={styles.tripsList}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Local building blocks ──────────────────────────────────

type StatChipProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  theme: ReturnType<typeof useAppTheme>;
};

function StatChip({ icon, label, value, theme }: StatChipProps) {
  return (
    <View style={styles.statChip} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={16} color={theme.accentAction} style={styles.statIcon} />
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  missingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  // Top bar
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  avatarWrap: {
    marginBottom: Spacing.md,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: Spacing.xs,
    maxWidth: '92%',
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: 14,
    marginTop: 2,
    maxWidth: '92%',
    textAlign: 'center',
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.xs,
  },
  heroMeta: {
    fontSize: 13,
  },
  heroMetaDot: {
    fontSize: 13,
    marginHorizontal: 2,
  },
  editPill: {
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  editPillText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Stats strip - flat, bracketed by hairlines top + bottom (matches the
  // Goals SummaryBanner overview).
  statsRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statChip: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    height: 28,
    width: 1,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Trips section
  tripsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
  },
  tripsList: {
    paddingRight: Spacing.md,
  },
  emptyTripsWrap: {
    paddingLeft: Spacing.xs,
  },

  bottomSpacer: {
    height: Spacing.xxl,
  },
});
