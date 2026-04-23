import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useAuth, useAppTheme, useHaptics, useToast } from '@/hooks';
import { PrimaryButton, PressableOpacity } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenContainer, KeyboardAwareForm, DecorativeCircles, PageHeader } from '@/components/layout';
import { Avatar } from '@/components/Avatar';
import { BorderRadius, Palette, Spacing, SharedStyles } from '@/constants';
import { deleteAvatar, isManagedAvatarUri, saveAvatar } from '@/utils/avatarStorage';

/**
 * The Edit Profile screen. Lets the user change their display name,
 * home city and profile picture. The picked picture is copied into
 * app-private storage on save so it survives across restarts.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { toast, showToast, hideToast } = useToast();

  // One source of truth for the form - seeded from context once, then the
  // user owns it. Defaulting to '' keeps inputs controlled from render 1.
  const [draft, setDraft] = useState({
    displayName: user?.displayName ?? '',
    homeCity: user?.homeCity ?? '',
    profilePicture: user?.profilePicture ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disable Save when nothing actually changed - a small touch that prevents
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
        // crop before the URI ever reaches us - cheaper than pulling in
        // expo-image-manipulator for a post-hoc crop.
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setDraft((prev) => ({ ...prev, profilePicture: result.assets[0].uri }));
      if (error) setError(null);
      haptics.success();
      showToast('Profile picture uploaded successfully', 'accent');
    } catch {
      showToast('Could not open photo library.', 'error');
      haptics.error();
    }
  }, [error, haptics, showToast]);

  const handleRemovePhoto = useCallback(() => {
    setDraft((prev) => ({ ...prev, profilePicture: '' }));
    if (error) setError(null);
    haptics.medium();
    showToast('Profile picture removed', 'accent');
  }, [error, haptics, showToast]);

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
      // user kept the existing photo - no copy needed.
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
      // user actually changed the photo. Best-effort - failures here are
      // swallowed inside `deleteAvatar`.
      const previous = user.profilePicture ?? '';
      if (previous && previous !== finalPicture) {
        await deleteAvatar(previous);
      }

      haptics.success();
      const previousPic = user.profilePicture ?? '';
      const pictureChanged = previousPic !== finalPicture;
      const message = pictureChanged
        ? finalPicture
          ? 'Profile picture updated successfully'
          : 'Profile picture removed successfully'
        : 'Profile updated';
      showToast(message, 'accent');
      // Hold long enough for the toast slide-in + dwell to fully play
      // before we pop the screen (Toast default duration is 1200ms).
      setTimeout(() => router.back(), 1400);
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
      <DecorativeCircles opacity={0.06} />
      <Toast {...toast} onHide={hideToast} position="bottom" />
      <PageHeader title="Edit Profile" />
      <KeyboardAwareForm>
        {/* Header avatar - mirrors the draft photo in real time so the
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
            <PressableOpacity
              onPress={handlePickPhoto}
              disabled={saving}
              pressedOpacity={0.85}
              style={[styles.photoButton, { backgroundColor: theme.accentAction }]}
              accessibilityRole="button"
              accessibilityLabel={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
            >
              <Ionicons name="camera-outline" size={16} color={Palette.white} />
              <Text style={styles.photoButtonText}>
                {hasPhoto ? 'Change Photo' : 'Add Photo'}
              </Text>
            </PressableOpacity>

            {hasPhoto ? (
              <PressableOpacity
                onPress={handleRemovePhoto}
                disabled={saving}
                pressedOpacity={0.7}
                style={[styles.removeButton, { borderColor: theme.cardBorder }]}
                accessibilityRole="button"
                accessibilityLabel="Remove profile photo"
              >
                <Ionicons name="trash-outline" size={15} color={theme.textSecondary} />
                <Text style={[styles.removeButtonText, { color: theme.textSecondary }]}>
                  Remove
                </Text>
              </PressableOpacity>
            ) : null}
          </View>
        </View>

        {/* Flat label-left / value-right rows - mirrors Instagram's edit
            profile layout. No card chrome, hairline dividers only. */}
        <View style={[styles.fieldRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Name</Text>
          <TextInput
            style={[styles.fieldInput, { color: theme.textPrimary }]}
            value={draft.displayName}
            onChangeText={(v) => onChangeField('displayName', v)}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            accessibilityLabel="Display name"
          />
        </View>

        <View style={[styles.fieldRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Home City</Text>
          <TextInput
            style={[styles.fieldInput, { color: theme.textPrimary }]}
            value={draft.homeCity}
            onChangeText={(v) => onChangeField('homeCity', v)}
            placeholder="e.g. Dublin"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            accessibilityLabel="Home city"
          />
        </View>

        {/* Email is read-only - mirrors the row rhythm but disables
            interaction so it's obvious the value can't be edited here. */}
        <View style={[styles.fieldRow, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Email</Text>
          <Text
            style={[styles.fieldValueReadOnly, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        </View>
        <Text style={[styles.emailHint, { color: theme.textSecondary }]}>
          You cannot change this.
        </Text>

        {error ? (
          <Text style={SharedStyles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View style={styles.saveSpacing}>
          <PrimaryButton
            label="Save Changes"
            variant="accent"
            loading={saving}
            disabled={!dirty}
            onPress={handleSave}
          />
        </View>
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
    borderRadius: BorderRadius.xs,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  photoButtonText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
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
  fieldRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingVertical: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    width: 110,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  fieldValueReadOnly: {
    flex: 1,
    fontSize: 16,
  },
  emailHint: {
    fontSize: 12,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
    paddingLeft: 110,
  },
  saveSpacing: {
    marginTop: Spacing.md,
  },
});
