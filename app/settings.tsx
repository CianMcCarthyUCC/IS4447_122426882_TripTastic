import { useMemo, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAuth,
  useToast,
  useHaptics,
  useAppTheme,
  useActivities,
  useTargets,
  useCategories,
  useReminderPreference,
} from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { SearchBar } from '@/components/forms';
import { SettingsListRow } from '@/components/cards';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenContainer, PageHeader, DecorativeCircles } from '@/components/layout';
import { Spacing } from '@/constants';
import { exportDataAsCsv } from '@/utils/csvExport';

/**
 * The Settings screen. Shows all of the user's account controls as a
 * flat list grouped into Preferences, Your Data and Account, with a
 * search bar at the top for quickly finding the right setting.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { logout, deleteAccount } = useAuth();
  const { activities } = useActivities();
  const { targets } = useTargets();
  const { categories } = useCategories();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const theme = useAppTheme();
  const { mode, setMode, isDark } = useThemeControl();
  const { enabled: notificationsEnabled, toggle: toggleReminder } = useReminderPreference();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState('');

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

  // Row manifest - each row is defined once as a plain config. The
  // search filter matches against label + hint, and the renderer spreads
  // the config straight into SettingsListRow.
  type RowConfig = ComponentProps<typeof SettingsListRow> & { key: string };
  const sections = useMemo((): ReadonlyArray<{ title: string; rows: RowConfig[] }> => {
    return [
      {
        title: 'Preferences',
        rows: [
          {
            key: 'dark-mode',
            icon: isDark ? 'moon' : 'sunny',
            label: 'Dark Mode',
            hint: `Currently: ${mode === 'system' ? 'Following device' : mode}`,
            trailing: 'switch',
            value: isDark,
            onValueChange: handleThemeToggle,
          },
          {
            key: 'daily-reminders',
            icon: 'notifications-outline',
            label: 'Daily Reminders',
            hint: 'Get reminded at 8pm to log your activities',
            trailing: 'switch',
            value: notificationsEnabled,
            onValueChange: handleNotificationToggle,
          },
        ],
      },
      {
        title: 'Manage',
        rows: [
          {
            key: 'categories',
            icon: 'pricetags-outline',
            label: 'Categories',
            hint: `Edit, add or remove your ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`,
            onPress: () => router.push('/categories'),
          },
        ],
      },
      {
        title: 'Your Data',
        rows: [
          {
            key: 'export-csv',
            icon: 'download-outline',
            label: 'Export as CSV',
            hint: 'Download activities & goals to share or back up',
            onPress: handleExport,
            loading: exporting,
            trailingIcon: 'download-outline' as const,
          },
        ],
      },
      {
        title: 'Account',
        rows: [
          {
            key: 'logout',
            icon: 'log-out-outline',
            label: 'Log Out',
            hint: 'Sign out of this device',
            onPress: handleLogout,
          },
          {
            key: 'delete-account',
            icon: 'trash-outline',
            label: 'Delete Account',
            hint: 'Permanently remove your account and all data',
            destructive: true,
            loading: deleting,
            onPress: () => {
              haptics.warning();
              setConfirmVisible(true);
            },
          },
        ],
      },
    ];
    // Disabling exhaustive-deps intentionally - the handlers close over state
    // but SettingsListRow is cheap to re-render and the list is tiny, so
    // rebuilding on every render is simpler than memoising every callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isDark, notificationsEnabled, exporting, deleting, categories.length]);

  // Case-insensitive match against label OR hint across all rows. An empty
  // query means "show everything" - keeps the no-search case zero-cost.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        rows: s.rows.filter(
          (r) =>
            r.label.toLowerCase().includes(q) ||
            (r.hint ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.rows.length > 0);
  }, [sections, query]);

  return (
    <ScreenContainer>
      <DecorativeCircles opacity={0.06} />
      <Toast {...toast} onHide={hideToast} />
      <PageHeader title="Settings" />
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search settings"
          suggestions={['Dark Mode', 'Reminders', 'Export', 'Log Out']}
        />

        {filtered.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No settings match "{query}".
          </Text>
        ) : (
          filtered.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                {section.title}
              </Text>
              {section.rows.map(({ key, ...rowProps }) => (
                <SettingsListRow key={key} {...rowProps} />
              ))}
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Are you sure?"
        message="This will permanently delete your account and all your data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: Spacing.xl,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
