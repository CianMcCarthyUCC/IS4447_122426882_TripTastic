import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useToast, useHaptics, useAppTheme } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { ProfileIcon } from '@/components/icons';
import { Spacing, BorderRadius, Shadows } from '@/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const theme = useAppTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Profile" subtitle="Your account details" />

      <View style={styles.avatar}>
        <ProfileIcon size={80} color={theme.accentAction} />
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <View style={styles.tagRow}>
          <InfoTag label="Email" value={user.email} />
        </View>
        <View style={styles.tagRow}>
          <InfoTag label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
        </View>
      </View>

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
  infoCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
});
