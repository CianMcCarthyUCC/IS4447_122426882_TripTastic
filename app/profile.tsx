import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useToast, useHaptics, useAppTheme, useActivities, useTargets, useCategories } from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { ProfileIcon } from '@/components/icons';
import { Spacing, BorderRadius, Shadows } from '@/constants';
import { exportDataAsCsv } from '@/utils/csvExport';
import { scheduleDailyReminder, cancelAllNotifications, requestNotificationPermissions } from '@/utils/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { activities } = useActivities();
  const { targets } = useTargets();
  const { categories } = useCategories();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const theme = useAppTheme();
  const { mode, setMode, isDark } = useThemeControl();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!user) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Profile" subtitle="Not signed in" />
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
    setLoading(true);
    try {
      await deleteAccount();
      haptics.success();
    } catch {
      showToast('Failed to delete account. Please try again.', 'error');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    haptics.light();
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          showToast('Notification permission denied', 'error');
          return;
        }
        await scheduleDailyReminder();
        setNotificationsEnabled(true);
        showToast('Daily reminders enabled', 'success');
      } else {
        await cancelAllNotifications();
        setNotificationsEnabled(false);
        showToast('Reminders disabled', 'info');
      }
      haptics.light();
    } catch {
      showToast('Failed to update notifications', 'error');
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" subtitle="Settings & account" />

        <View style={styles.avatar}>
          <ProfileIcon size={80} color={theme.accentAction} />
        </View>

        {/* Account info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Account</Text>
          <View style={styles.tagRow}>
            <InfoTag label="Email" value={user.email} />
          </View>
          <View style={styles.tagRow}>
            <InfoTag label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
          </View>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={theme.accentAction} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.cardBorder, true: theme.accentAction }}
              accessibilityLabel="Toggle dark mode"
            />
          </View>
          <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
            Currently: {mode === 'system' ? 'Following device' : mode}
          </Text>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons name="notifications-outline" size={20} color={theme.accentAction} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Daily Reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: theme.cardBorder, true: theme.accentAction }}
              accessibilityLabel="Toggle daily reminders"
            />
          </View>
          <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
            Get reminded at 8pm to log your activities
          </Text>
        </View>

        {/* Data */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Data</Text>
          <PrimaryButton
            label="Export Data (CSV)"
            variant="secondary"
            loading={exporting}
            onPress={handleExport}
          />
          <Text style={[styles.settingHint, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
            Export your activities and goals as a CSV file
          </Text>
        </View>

        {/* Account actions */}
        <ButtonGroup>
          <PrimaryButton label="Logout" variant="secondary" onPress={handleLogout} />
          <PrimaryButton
            label="Delete Account"
            loading={loading}
            variant="danger"
            onPress={() => { haptics.warning(); setConfirmVisible(true); }}
          />
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingHint: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
