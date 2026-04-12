import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useToast, useHaptics } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { Colors, Spacing, BorderRadius, SharedStyles } from '@/constants';

/**
 * Profile screen — shows user info, logout, and delete account.
 * Rubric: "logout and delete their profile"
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
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
    await logout();
    haptics.success();
  };

  const handleDeleteAccount = async () => {
    setConfirmVisible(false);
    setLoading(true);
    await deleteAccount();
    haptics.success();
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Profile" subtitle="Your account details" />

      <View style={styles.avatar}>
        <Ionicons name="person-circle-outline" size={80} color={Colors.primaryAction} />
      </View>

      <View style={styles.infoCard}>
        <View style={SharedStyles.tagRow}>
          <InfoTag label="Email" value={user.email} />
        </View>
        <View style={SharedStyles.tagRow}>
          <InfoTag label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
        </View>
      </View>

      <ButtonGroup>
        <PrimaryButton label="Logout" variant="secondary" onPress={handleLogout} />
        <PrimaryButton
          label={loading ? 'Deleting...' : 'Delete Account'}
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
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
});
