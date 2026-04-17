import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useToast, useHaptics, useAppTheme, useActivities, useTargets, useCategories } from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { ProfileIcon } from '@/components/icons';
import { SettingsSection, SettingToggle } from '@/components/cards';
import { Spacing } from '@/constants';
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
        <SettingsSection title="Account">
          <View style={styles.tagRow}>
            <InfoTag label="Email" value={user.email} />
          </View>
          <View style={styles.tagRow}>
            <InfoTag label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
          </View>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingToggle
            icon={isDark ? 'moon' : 'sunny'}
            label="Dark Mode"
            hint={`Currently: ${mode === 'system' ? 'Following device' : mode}`}
            value={isDark}
            onValueChange={handleThemeToggle}
            accessibilityLabel="Toggle dark mode"
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingToggle
            icon="notifications-outline"
            label="Daily Reminders"
            hint="Get reminded at 8pm to log your activities"
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            accessibilityLabel="Toggle daily reminders"
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <PrimaryButton
            label="Export Data (CSV)"
            variant="secondary"
            loading={exporting}
            onPress={handleExport}
          />
          <Text style={[styles.dataHint, { color: theme.textSecondary }]}>
            Export your activities and goals as a CSV file
          </Text>
        </SettingsSection>

        {/* Account actions */}
        <ButtonGroup>
          <PrimaryButton label="Logout" variant="secondary" onPress={handleLogout} />
          <PrimaryButton
            label="Delete Account"
            loading={loading}
            variant="danger"
            onPress={() => { haptics.warning(); setConfirmVisible(true); }}
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  dataHint: {
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
