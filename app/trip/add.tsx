import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useTrips, useTripForm, useFormSubmit, useAppTheme, useHaptics } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { FormField, DateRangeCalendar } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import { KeyboardAwareForm } from '@/components/layout';
import { Spacing, BorderRadius, Shadows, Palette, SharedStyles } from '@/constants';
import { getDestinationPhoto } from '@/utils/unsplashApi';

// Which wizard step each required field lives on. Used to snap the user
// back to the step containing a missing field when they hit Create Trip
// without having filled step 1 out fully. Mirrors the STEP_OF_FIELD map
// in ActivityForm so the two add-flows behave consistently.
const STEP_OF_FIELD = {
  name: 1,
  destination: 1,
  country: 1,
  startDate: 2,
  endDate: 2,
} as const;

export default function AddTrip() {
  const router = useRouter();
  const { addTrip } = useTrips();
  const { formData, onChangeField } = useTripForm();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const mounted = useMountedRef();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview - fetch Unsplash image as user types destination
  useEffect(() => {
    if (formData.coverImage) { setPreviewImage(formData.coverImage); return; }
    if (!formData.destination.trim() || formData.destination.length < 3) { setPreviewImage(null); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const photo = await getDestinationPhoto(formData.destination);
      if (mounted.current) setPreviewImage(photo);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.destination, formData.coverImage, mounted]);

  const submitTrip = useCallback(async () => {
    let finalData = { ...formData };
    if (!finalData.coverImage && previewImage) {
      finalData = { ...finalData, coverImage: previewImage };
    } else if (!finalData.coverImage && finalData.destination.trim()) {
      const photo = await getDestinationPhoto(finalData.destination);
      if (photo) finalData = { ...finalData, coverImage: photo };
    }
    await addTrip(finalData);
  }, [formData, previewImage, addTrip]);

  // Let the default flow run: useFormSubmit emits the "Trip created"
  // toast on the global bus and navigates back, matching the feedback
  // style of the other add/delete flows.
  const { error, loading, handleSubmit, toast, hideToast } = useFormSubmit(
    submitTrip,
    'Trip created',
  );

  const pickHeroImage = useCallback(async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChangeField('coverImage', result.assets[0].uri);
    }
  }, [onChangeField]);

  const clearHeroImage = useCallback(() => {
    onChangeField('coverImage', '');
    setPreviewImage(null);
  }, [onChangeField]);

  // Full-form validation - returns the first error + the step it lives on
  // so we can both show the error and snap to the right step.
  const validate = (): { message: string; field: keyof typeof STEP_OF_FIELD } | null => {
    if (!formData.name.trim()) return { message: 'Trip name is required.', field: 'name' };
    if (!formData.destination.trim()) return { message: 'Destination city is required.', field: 'destination' };
    if (!formData.country.trim()) return { message: 'Country is required.', field: 'country' };
    if (!formData.startDate) return { message: 'Start date is required.', field: 'startDate' };
    if (!formData.endDate) return { message: 'End date is required.', field: 'endDate' };
    const today = new Date().toISOString().slice(0, 10);
    if (formData.startDate < today) return { message: 'Trip start date cannot be in the past.', field: 'startDate' };
    if (formData.endDate < formData.startDate) return { message: 'End date must be on or after the start date.', field: 'endDate' };
    return null;
  };

  const stepOneComplete = !!formData.name.trim() && !!formData.destination.trim() && !!formData.country.trim();
  const isIncomplete = !stepOneComplete || !formData.startDate || !formData.endDate;

  // Guard "Next": don't let the user advance until the step-1 fields are
  // filled - buzz + inline error when they try.
  const [stepOneError, setStepOneError] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    if (!formData.name.trim()) {
      setStepOneError('Trip name is required.');
      haptics.error();
      return;
    }
    if (!formData.destination.trim()) {
      setStepOneError('Destination city is required.');
      haptics.error();
      return;
    }
    if (!formData.country.trim()) {
      setStepOneError('Country is required.');
      haptics.error();
      return;
    }
    setStepOneError(null);
    haptics.light();
    setStep(2);
  }, [formData.name, formData.destination, formData.country, haptics]);

  const handleCreate = useCallback(() => {
    const err = validate();
    if (err) {
      const targetStep = STEP_OF_FIELD[err.field];
      if (targetStep !== step) setStep(targetStep);
      handleSubmit(err.message);
      return;
    }
    handleSubmit(null);
  }, [handleSubmit, step]);

  const stepIndicator = useMemo(
    () => (
      <View style={styles.stepperRow}>
        <View style={styles.stepDots}>
          <View
            style={[
              styles.stepDot,
              { backgroundColor: step === 1 ? theme.accentAction : theme.cardBorder },
            ]}
          />
          <View
            style={[
              styles.stepDot,
              { backgroundColor: step === 2 ? theme.accentAction : theme.cardBorder },
            ]}
          />
        </View>
        <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
          Step {step} of 2 - {step === 1 ? 'Where' : 'When'}
        </Text>
      </View>
    ),
    [step, theme.accentAction, theme.cardBorder, theme.textSecondary],
  );

  return (
    <SlideUpSheet
      title="Plan a New Trip"
      subtitle="Where are you headed next?"
      onClose={() => router.back()}
    >
      <Toast {...toast} onHide={hideToast} />

      {stepIndicator}

      {step === 1 ? (
        <>
          {/* Live preview hero - cover photo lives on step 1 because it
              depends on the destination field. */}
          {previewImage ? (
            <Pressable
              onPress={pickHeroImage}
              accessibilityRole="button"
              accessibilityLabel="Replace cover photo"
              style={styles.heroWrapper}
            >
              <Image
                source={{ uri: previewImage }}
                style={styles.hero}
                accessibilityLabel="Destination photo preview"
                accessibilityRole="image"
              />
              <Pressable
                onPress={clearHeroImage}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Remove cover photo"
                style={styles.heroRemove}
              >
                <Ionicons name="close-circle" size={28} color={Palette.white} />
              </Pressable>
              {formData.coverImage ? (
                <View style={styles.heroBadge}>
                  <Ionicons name="image" size={12} color={Palette.white} />
                  <Text style={styles.heroBadgeText}>Your photo</Text>
                </View>
              ) : null}
            </Pressable>
          ) : (
            <Pressable
              onPress={pickHeroImage}
              accessibilityRole="button"
              accessibilityLabel="Add a cover photo"
              accessibilityHint="Opens the photo library to pick a cover"
              style={({ pressed }) => [
                styles.hero,
                styles.heroPlaceholder,
                {
                  backgroundColor: theme.tagBackground,
                  borderColor: theme.textSecondary,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <View style={[styles.heroIconBubble, { backgroundColor: theme.accentAction }]}>
                <Ionicons name="cloud-upload-outline" size={22} color={Palette.white} />
              </View>
              <Text style={[styles.heroCta, { color: theme.accentAction }]}>
                {formData.destination ? 'Loading preview…' : 'Tap to add cover photo'}
              </Text>
              {!formData.destination ? (
                <Text style={[styles.heroText, { color: theme.textSecondary }]}>
                  Pick your own - or we’ll grab one from your destination
                </Text>
              ) : null}
            </Pressable>
          )}

          <KeyboardAwareForm>
            <View style={SharedStyles.form}>
              <FormField
                label="Trip Name"
                helpText="Give your trip a memorable name"
                value={formData.name}
                onChangeText={(v) => onChangeField('name', v)}
                placeholder="e.g. Summer in Italy"
              />
              <FormField
                label="Destination City"
                helpText="Used for weather + auto cover photo"
                value={formData.destination}
                onChangeText={(v) => onChangeField('destination', v)}
                placeholder="e.g. Rome"
              />
              <FormField
                label="Country"
                helpText="Used for currency, language, and timezone"
                value={formData.country}
                onChangeText={(v) => onChangeField('country', v)}
                placeholder="e.g. Italy"
              />
            </View>

            {stepOneError ? (
              <Text style={SharedStyles.errorText} accessibilityRole="alert">
                {stepOneError}
              </Text>
            ) : null}

            <View style={styles.navRow}>
              <View style={styles.navSide}>
                <PrimaryButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  disabled={loading}
                />
              </View>
              <View style={styles.navSide}>
                <PrimaryButton
                  label="Next"
                  variant="accent"
                  onPress={handleNext}
                  accessibilityLabel="Continue to when"
                />
              </View>
            </View>
          </KeyboardAwareForm>
        </>
      ) : (
        <KeyboardAwareForm>
          <View style={SharedStyles.form}>
            <DateRangeCalendar
              start={formData.startDate || null}
              end={formData.endDate || null}
              onChange={(s, e) => {
                onChangeField('startDate', s ?? '');
                onChangeField('endDate', e ?? '');
              }}
              minDate={new Date().toISOString().slice(0, 10)}
            />
          </View>

          {/* Summary chip - quick recap of the step-1 choices so the user
              doesn't need to step back just to double-check what they
              picked before committing. Same pattern as ActivityForm. */}
          <View style={[styles.summaryChip, { borderColor: theme.cardBorder, backgroundColor: theme.tagBackground }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={2}>
              {formData.name} · {formData.destination}, {formData.country}
            </Text>
          </View>

          {error ? <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text> : null}

          <View style={styles.navRow}>
            <View style={styles.navSide}>
              <PrimaryButton
                label="Back"
                variant="secondary"
                onPress={() => setStep(1)}
                disabled={loading}
              />
            </View>
            <View style={styles.navSide}>
              <PrimaryButton
                label="Create Trip"
                variant="accent"
                onPress={handleCreate}
                loading={loading}
                disabled={isIncomplete}
              />
            </View>
          </View>
        </KeyboardAwareForm>
      )}

    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepDot: {
    borderRadius: BorderRadius.pill,
    height: 8,
    width: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  navSide: {
    flex: 1,
  },
  summaryChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  heroWrapper: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  hero: {
    borderRadius: BorderRadius.md,
    height: 160,
    marginBottom: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  heroPlaceholder: {
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  heroIconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
    ...Shadows.sm,
  },
  heroCta: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.pill,
    bottom: Spacing.sm + Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.xs,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    position: 'absolute',
  },
  heroBadgeText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  heroRemove: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
  },
});
