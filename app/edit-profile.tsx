import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useAuth, useAppTheme, useHaptics, useToast } from '@/hooks';
import { FormField } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenContainer, KeyboardAwareForm } from '@/components/layout';
import { Avatar } from '@/components/Avatar';
import { BorderRadius, Shadows, Spacing, SharedStyles } from '@/constants';
import { deleteAvatar, isManagedAvatarUri, saveAvatar } from '@/utils/avatarStorage';

/**
 * Edit Profile — three fields (display name, home city, profile picture)
 * wired straight through Drizzle via `useAuth().updateProfile`. Local
 * `draft` state is the single source of truth while editing; on Save we
 * persist the picked image to app-private storage first, then persist
 * the user row, then clean up any previous avatar file.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { toast, showToast, hideToast } = useToast();

  // One source of truth for the form — seeded from context once, then the
  // user owns it. Defaulting to '' keeps inputs controlled from render 1.
  const [draft, setDraft] = useState({
    displayName: user?.displayName ?? '',
    homeCity: user?.homeCity ?? '',
    profilePicture: user?.profilePicture ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disable Save when nothing actually changed — a small touch that prevents
  // pointless DB writes and makes it obvious when the form is "clean".
  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      draft.displayName.trim() !== (user.displayName ?? '').trim() ||
      draft.homeCity.trim() !== (user.homeCity ?? '').trim() ||
      draft.profilePicture !== (user.profilePicture ?? '')
    );
  }, [draft, user]);

  const onChangeField = useCallback(
    (field: 'displayName' | 'homeCity', value: string) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
      if (error) setError(null);
    },
    [error],
  );

  const handlePickPhoto = useCallback(async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        // `allowsEditing` + square aspect lets the picker enforce the 1:1
        // crop before the URI ever reaches us — cheaper than pulling in
        // expo-image-manipulator for a post-hoc crop.
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setDraft((prev) => ({ ...prev, profilePicture: result.assets[0].uri }));
      if (error) setError(null);
      haptics.light();
    } catch {
      showToast('Could not open photo library.', 'error');
      haptics.error();
    }
  }, [error, haptics, showToast]);

  const handleRemovePhoto = useCallback(() => {
    setDraft((prev) => ({ ...prev, profilePicture: '' }));
    if (error) setError(null);
    haptics.light();
  }, [error, haptics]);

  const validate = (): string | null => {
    if (draft.displayName.length > 60) return 'Display name is too long (max 60 characters).';
    if (draft.homeCity.length > 80) return 'Home city is too long (max 80 characters).';
    return null;
  };

  const handleSave = async () => {
    const message = validate();
    if (message) {
      setError(message);
      haptics.error();
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      // If the draft holds a fresh picker URI (cache path), copy it into
      // app-private storage first so the persisted URI survives restarts.
      // A URI that's already under `documentDirectory/avatars/` means the
      // user kept the existing photo — no copy needed.
      let finalPicture = draft.profilePicture;
      if (finalPicture && !isManagedAvatarUri(finalPicture)) {
        finalPicture = await saveAvatar(user.id, finalPicture);
      }

      const err = await updateProfile({
        displayName: draft.displayName,
        homeCity: draft.homeCity,
        profilePicture: finalPicture,
      });
      if (err) {
        setError(err);
        haptics.error();
        return;
      }

      // After a successful save, remove the previous avatar file if the
      // user actually changed the photo. Best-effort — failures here are
      // swallowed inside `deleteAvatar`.
      const previous = user.profilePicture ?? '';
      if (previous && previous !== finalPicture) {
        await deleteAvatar(previous);
      }

      haptics.success();
      showToast('Profile updated', 'success');
      // Brief delay so the toast is visible before the screen pops.
      setTimeout(() => router.back(), 400);
    } catch {
      setError('Could not save profile. Please try again.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={[styles.missing, { color: theme.textPrimary }]}>Not signed in</Text>
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const hasPhoto = draft.profilePicture.length > 0;

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <KeyboardAwareForm>
        {/* Header avatar — mirrors the draft photo in real time so the
            user can preview the crop before saving. The "Change photo"
            button doubles as the primary CTA since the avatar itself is
            not tappable (a big photo picker target reads better as its
            own labelled button for screen-reader users). */}
        <View style={styles.headerBlock}>
          <Avatar
            uri={draft.profilePicture}
            displayName={draft.displayName || user.displayName}
            email={user.email}
            size={96}
          />

          <View style={styles.photoActions}>
            <Pressable
              onPress={handlePickPhoto}
              disabled={saving}
              style={({ pressed }) => [
                styles.photoButton,
                {
                  backgroundColor: theme.accentAction,
                  opacity: pressed || saving ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
            >
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              <Text style={styles.photoButtonText}>
                {hasPhoto ? 'Change Photo' : 'Add Photo'}
              </Text>
            </Pressable>

            {hasPhoto ? (
              <Pressable
                onPress={handleRemovePhoto}
                disabled={saving}
                style={({ pressed }) => [
                  styles.removeButton,
                  {
                    borderColor: theme.cardBorder,
                    opacity: pressed || saving ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Remove profile photo"
              >
                <Ionicons name="trash-outline" size={15} color={theme.textSecondary} />
                <Text style={[styles.removeButtonText, { color: theme.textSecondary }]}>
                  Remove
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>Edit Profile</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            How should we address you across TripTastic?
          </Text>
        </View>

        {/* Read-only email — surfacing it makes it obvious which account
            is being edited; it's intentionally not editable because the
            email is the user's login identity. */}
        <View
          style={[
            styles.readOnlyCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <Text style={[styles.readOnlyLabel, { color: theme.textSecondary }]}>
            Account Email
          </Text>
          <Text style={[styles.readOnlyValue, { color: theme.textPrimary }]} numberOfLines={1}>
            {user.email}
          </Text>
          <Text style={[styles.readOnlyHint, { color: theme.textSecondary }]}>
            Your email can't be changed here. Contact support if you need to update it.
          </Text>
        </View>

        <View style={SharedStyles.form}>
          <FormField
            label="Display Name"
            helpText="Shown on your Account screen and in greetings."
            value={draft.displayName}
            onChangeText={(v) => onChangeField('displayName', v)}
            placeholder="e.g. Cian McCarthy"
            autoCapitalize="words"
            accessibilityLabel="Display name"
          />
          <FormField
            label="Home City"
            helpText="Used as the default when creating new trips."
            value={draft.homeCity}
            onChangeText={(v) => onChangeField('homeCity', v)}
            placeholder="e.g. Dublin"
            autoCapitalize="words"
            accessibilityLabel="Home city"
          />
        </View>

        {error ? (
          <Text style={SharedStyles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <PrimaryButton
          label="Save Changes"
          variant="accent"
          loading={saving}
          disabled={!dirty}
          onPress={handleSave}
        />
        <View style={SharedStyles.buttonSpacing}>
          <PrimaryButton
            label="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={saving}
          />
        </View>
      </KeyboardAwareForm>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  missing: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    textAlign: 'center',
  },
  readOnlyCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  readOnlyHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
