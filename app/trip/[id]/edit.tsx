import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import {
  useAppTheme,
  useFormSubmit,
  useHaptics,
  useToast,
  useTripForm,
  useTrips,
  useActivities,
} from '@/hooks';
import { FormField, DateRangeCalendar } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { EditEntityScreen, KeyboardAwareForm } from '@/components/layout';
import { BorderRadius, Palette, Shadows, SharedStyles, Spacing } from '@/constants';

type PendingConfirm = 'clear' | 'delete' | null;

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const router = useRouter();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { findTripById, updateTrip, deleteTrip } = useTrips();
  const { clearTripActivities } = useActivities();
  const { formData, onChangeField, populateForm } = useTripForm();
  const { toast, showToast, hideToast } = useToast();

  const trip = findTripById(tripId);
  const [pending, setPending] = useState<PendingConfirm>(null);
  const [busy, setBusy] = useState(false);

  const pickCoverImage = useCallback(async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      onChangeField('coverImage', result.assets[0].uri);
      haptics.success();
      showToast('Cover photo updated', 'accent');
    } catch {
      haptics.error();
      showToast('Could not open photo library', 'error');
    }
  }, [onChangeField, haptics, showToast]);

  const clearCoverImage = useCallback(() => {
    onChangeField('coverImage', '');
    haptics.medium();
  }, [onChangeField, haptics]);

  useEffect(() => {
    if (!trip) return;
    populateForm({
      name: trip.name,
      destination: trip.destination,
      country: trip.country,
      coverImage: trip.coverImage,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  }, [trip?.id, populateForm]);

  const validate = useCallback((): string | null => {
    if (!formData.name.trim()) return 'Trip name is required.';
    if (!formData.destination.trim()) return 'Destination city is required.';
    if (!formData.country.trim()) return 'Country is required.';
    if (!formData.startDate) return 'Start date is required.';
    if (!formData.endDate) return 'End date is required.';
    if (formData.endDate < formData.startDate) return 'End date must be on or after the start date.';
    return null;
  }, [formData]);

  const {
    error,
    loading,
    handleSubmit,
    toast: submitToast,
    hideToast: hideSubmitToast,
  } = useFormSubmit(async () => {
    await updateTrip(tripId, formData);
  }, 'Trip updated');

  const handleClearActivities = useCallback(async () => {
    setPending(null);
    setBusy(true);
    try {
      await clearTripActivities(tripId);
      haptics.success();
      showToast('Activities cleared', 'accent');
    } catch {
      haptics.error();
      showToast('Failed to clear activities', 'error');
    } finally {
      setBusy(false);
    }
  }, [tripId, clearTripActivities, haptics, showToast]);

  const handleDeleteTrip = useCallback(async () => {
    setPending(null);
    setBusy(true);
    try {
      await deleteTrip(tripId);
      haptics.success();
      router.replace('/(tabs)');
    } catch {
      haptics.error();
      showToast('Failed to delete trip', 'error');
      setBusy(false);
    }
  }, [tripId, deleteTrip, haptics, router, showToast]);

  if (!trip) {
    return (
      <EditEntityScreen title="Edit Trip" toast={submitToast} onHideToast={hideSubmitToast}>
        <Text style={{ color: theme.textSecondary }}>Trip not found.</Text>
      </EditEntityScreen>
    );
  }

  return (
    <EditEntityScreen title="Edit Trip" toast={submitToast} onHideToast={hideSubmitToast}>
      <Toast {...toast} onHide={hideToast} />
      <KeyboardAwareForm>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.coverBlock}>
            <Text style={[styles.coverLabel, { color: theme.textSecondary }]}>
              Cover Photo
            </Text>
            {formData.coverImage ? (
              <Pressable
                onPress={pickCoverImage}
                accessibilityRole="button"
                accessibilityLabel="Change cover photo"
                style={styles.coverWrapper}
              >
                <Image
                  source={{ uri: formData.coverImage }}
                  style={styles.cover}
                  accessibilityLabel="Current cover photo"
                  accessibilityRole="image"
                />
                <View style={styles.coverOverlay}>
                  <Ionicons name="camera" size={18} color={Palette.white} />
                  <Text style={styles.coverOverlayText}>Change photo</Text>
                </View>
                <Pressable
                  onPress={clearCoverImage}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Remove cover photo"
                  style={styles.coverRemove}
                >
                  <Ionicons name="close-circle" size={26} color={Palette.white} />
                </Pressable>
              </Pressable>
            ) : (
              <Pressable
                onPress={pickCoverImage}
                accessibilityRole="button"
                accessibilityLabel="Add a cover photo"
                style={({ pressed }) => [
                  styles.cover,
                  styles.coverPlaceholder,
                  {
                    backgroundColor: theme.tagBackground,
                    borderColor: theme.textSecondary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[styles.coverIconBubble, { backgroundColor: theme.accentAction }]}>
                  <Ionicons name="cloud-upload-outline" size={20} color={Palette.white} />
                </View>
                <Text style={[styles.coverCta, { color: theme.accentAction }]}>
                  Tap to add cover photo
                </Text>
              </Pressable>
            )}
          </View>

          <View style={SharedStyles.form}>
            <FormField
              label="Trip Name"
              value={formData.name}
              onChangeText={(v) => onChangeField('name', v)}
              placeholder="e.g. Summer in Italy"
            />
            <FormField
              label="Destination City"
              value={formData.destination}
              onChangeText={(v) => onChangeField('destination', v)}
              placeholder="e.g. Rome"
            />
            <FormField
              label="Country"
              value={formData.country}
              onChangeText={(v) => onChangeField('country', v)}
              placeholder="e.g. Italy"
            />
            <DateRangeCalendar
              start={formData.startDate || null}
              end={formData.endDate || null}
              onChange={(s, e) => {
                onChangeField('startDate', s ?? '');
                onChangeField('endDate', e ?? '');
              }}
            />
          </View>

          {error ? (
            <Text style={SharedStyles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton
              label="Save Changes"
              variant="accent"
              onPress={() => handleSubmit(validate())}
              loading={loading}
            />
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              disabled={loading}
            />
          </View>

          <View style={styles.dangerZone}>
            <Text style={[styles.dangerLabel, { color: theme.textSecondary }]}>
              Manage trip
            </Text>

            <Pressable
              onPress={() => {
                haptics.medium();
                setPending('clear');
              }}
              disabled={busy || loading}
              accessibilityRole="button"
              accessibilityLabel="Clear all activities on this trip"
              style={({ pressed }) => [
                styles.dangerRow,
                { borderColor: theme.cardBorder, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons name="trash-bin-outline" size={18} color={theme.dangerAction} />
              <View style={styles.dangerText}>
                <Text style={[styles.dangerTitle, { color: theme.dangerAction }]}>
                  Clear all activities
                </Text>
                <Text style={[styles.dangerHint, { color: theme.textSecondary }]}>
                  Removes every activity on this trip. The trip itself stays.
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.medium();
                setPending('delete');
              }}
              disabled={busy || loading}
              accessibilityRole="button"
              accessibilityLabel="Delete this trip"
              style={({ pressed }) => [
                styles.dangerRow,
                { borderColor: theme.cardBorder, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color={theme.dangerAction} />
              <View style={styles.dangerText}>
                <Text style={[styles.dangerTitle, { color: theme.dangerAction }]}>
                  Delete trip
                </Text>
                <Text style={[styles.dangerHint, { color: theme.textSecondary }]}>
                  Deletes the trip and all of its activities and goals.
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAwareForm>

      <ConfirmDialog
        visible={pending === 'clear'}
        title="Clear all activities?"
        message="Every activity on this trip will be permanently removed. This can't be undone."
        confirmLabel="Clear activities"
        variant="danger"
        onConfirm={handleClearActivities}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        visible={pending === 'delete'}
        title="Delete this trip?"
        message="The trip and all of its activities and goals will be permanently removed."
        confirmLabel="Delete trip"
        variant="danger"
        onConfirm={handleDeleteTrip}
        onCancel={() => setPending(null)}
      />
    </EditEntityScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  coverBlock: {
    marginBottom: Spacing.lg,
  },
  coverLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  coverWrapper: {
    position: 'relative',
  },
  cover: {
    borderRadius: BorderRadius.md,
    height: 160,
    width: '100%',
    ...Shadows.sm,
  },
  coverPlaceholder: {
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  coverIconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...Shadows.sm,
  },
  coverCta: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  coverOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.pill,
    bottom: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    position: 'absolute',
  },
  coverOverlayText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  coverRemove: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dangerZone: {
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  dangerRow: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  dangerText: {
    flex: 1,
    gap: 2,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dangerHint: {
    fontSize: 12,
    fontWeight: '500',
  },
});
