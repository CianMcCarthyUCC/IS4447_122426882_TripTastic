import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  useCategories,
  useReminderPreference,
} from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenContainer } from '@/components/layout';
import { SettingsSection, SettingToggle } from '@/components/cards';
import { Avatar } from '@/components/Avatar';
import { BorderRadius, Shadows, Spacing } from '@/constants';
import { exportDataAsCsv } from '@/utils/csvExport';
import { formatIsoDate } from '@/utils/dateHelpers';

/**
 * Account screen — hero identity block + at-a-glance stats + grouped
 * preference rows. Mirrors the "profile dashboard" pattern used in modern
 * travel apps: who you are on top, what you've done in the middle, what
 * you can tweak below. All data comes from local SQLite via existing hooks
 * so the screen is fully offline-capable.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { activities } = useActivities();
  const { targets } = useTargets();
  const { trips } = useTrips();
  const { categories } = useCategories();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const theme = useAppTheme();
  const { mode, setMode, isDark } = useThemeControl();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { enabled: notificationsEnabled, toggle: toggleReminder } = useReminderPreference();

  // Derived display bits — stable across renders thanks to useMemo; we fall
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

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={[styles.missingTitle, { color: theme.textPrimary }]}>Not signed in</Text>
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      haptics.success();
    } catch {
      showToast('Failed to logout. Please try again.', 'error');
      haptics.error();
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      await deleteAccount();
      haptics.success();
    } catch {
      showToast('Failed to delete account. Please try again.', 'error');
      haptics.error();
    } finally {
      setDeleting(false);
    }
  };

  const handleThemeToggle = () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    haptics.light();
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    const result = await toggleReminder(enabled);
    switch (result) {
      case 'enabled':
        showToast('Daily reminders enabled', 'success');
        haptics.light();
        break;
      case 'disabled':
        showToast('Reminders disabled', 'info');
        haptics.light();
        break;
      case 'permission-denied':
        showToast('Notification permission denied', 'error');
        break;
      case 'error':
        showToast('Failed to update notifications', 'error');
        break;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDataAsCsv(activities, targets, categories);
      haptics.success();
      showToast('Data exported', 'success');
    } catch {
      showToast('Failed to export. Please try again.', 'error');
      haptics.error();
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Dragging to scroll dismisses the keyboard — the native iOS/Android
        // pattern, and the replacement for the tap-on-background dismiss
        // that lived in ScreenContainer's removed press wrapper.
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ──────────────────────────────────────────────
            Circular avatar + name + email + home-city line + Edit Profile
            pill. Uses initials on the avatar rather than a stock icon so
            accounts feel personal once display-name is filled in. */}
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

          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/edit-profile');
            }}
            style={({ pressed }) => [
              styles.editPill,
              {
                backgroundColor: theme.accentAction,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editPillText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* ── Stats strip ───────────────────────────────────────
            At-a-glance numbers that make the Account screen feel like
            *their* screen, not a settings dump. Three chips side-by-side
            flex equally so it stays responsive on every width. */}
        <View style={styles.statsRow}>
          <StatChip
            icon="airplane"
            label="Trips"
            value={trips.length}
            theme={theme}
          />
          <StatChip
            icon="checkmark-done"
            label="Activities"
            value={activities.length}
            theme={theme}
          />
          <StatChip
            icon="flag"
            label="Goals"
            value={targets.length}
            theme={theme}
          />
        </View>

        {/* ── Preferences ───────────────────────────────────── */}
        <SettingsSection title="Preferences">
          <SettingToggle
            icon={isDark ? 'moon' : 'sunny'}
            label="Dark Mode"
            hint={`Currently: ${mode === 'system' ? 'Following device' : mode}`}
            value={isDark}
            onValueChange={handleThemeToggle}
            accessibilityLabel="Toggle dark mode"
          />
          <View style={styles.toggleDivider} />
          <SettingToggle
            icon="notifications-outline"
            label="Daily Reminders"
            hint="Get reminded at 8pm to log your activities"
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            accessibilityLabel="Toggle daily reminders"
          />
        </SettingsSection>

        {/* ── Data ──────────────────────────────────────────── */}
        <SettingsSection title="Your Data">
          <ActionRow
            icon="download-outline"
            label="Export as CSV"
            hint="Download activities & goals to share or back up"
            onPress={handleExport}
            loading={exporting}
            theme={theme}
          />
        </SettingsSection>

        {/* ── Account actions ───────────────────────────────── */}
        <ButtonGroup>
          <PrimaryButton label="Log Out" variant="secondary" onPress={handleLogout} />
          <PrimaryButton
            label="Delete Account"
            loading={deleting}
            variant="danger"
            onPress={() => {
              haptics.warning();
              setConfirmVisible(true);
            }}
          />
        </ButtonGroup>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Account"
        message="This will permanently delete your account and all your data. This action cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmVisible(false)}
      />
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

/**
 * Compact at-a-glance stat card. Kept local to the screen because it's
 * only used here — if another surface needs it later it can move into
 * `components/cards`.
 */
function StatChip({ icon, label, value, theme }: StatChipProps) {
  return (
    <View
      style={[
        styles.statChip,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <View style={[styles.statIconBubble, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name={icon} size={18} color={theme.accentAction} />
      </View>
      <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

type ActionRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  loading?: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
};

/**
 * Tappable row with leading icon + label/hint + trailing chevron. Used
 * for the "Export as CSV" action — feels more at home inside a
 * SettingsSection than a full-width button would.
 */
function ActionRow({ icon, label, hint, loading, onPress, theme }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionRow,
        { opacity: pressed || loading ? 0.6 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: Boolean(loading) }}
    >
      <View style={[styles.actionIconBubble, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name={icon} size={18} color={theme.accentAction} />
      </View>
      <View style={styles.actionTextCol}>
        <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.actionHint, { color: theme.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <Ionicons
        name={loading ? 'time-outline' : 'chevron-forward'}
        size={20}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  missingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  avatarWrap: {
    // Spacing below the avatar matches what the previous inline ring had
    // via `marginBottom` on `avatarRing`. Kept as a wrapper so the Avatar
    // component stays layout-neutral.
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
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  editPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Stats strip
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  statIconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    width: 36,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // Preferences divider between toggles
  toggleDivider: {
    height: Spacing.md,
  },

  // Action row
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  actionIconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionTextCol: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionHint: {
    fontSize: 13,
    marginTop: 2,
  },

  bottomSpacer: {
    height: Spacing.xxl,
  },
});
