import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useTripForm, useFormSubmit, useAppTheme } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { FormField, DateField, ImagePicker } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenContainer, KeyboardAwareForm } from '@/components/layout';
import { Spacing, BorderRadius, Shadows, Palette, SharedStyles } from '@/constants';
import { getDestinationPhoto } from '@/utils/unsplashApi';

export default function AddTrip() {
  const router = useRouter();
  const { addTrip } = useTrips();
  const { formData, onChangeField } = useTripForm();
  const theme = useAppTheme();
  const mounted = useMountedRef();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview — fetch Unsplash image as user types destination
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

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(submitTrip, 'Trip created');

  const validate = () => {
    if (!formData.name.trim()) return 'Trip name is required.';
    if (!formData.destination.trim()) return 'Destination city is required.';
    if (!formData.country.trim()) return 'Country is required.';
    if (!formData.startDate) return 'Start date is required.';
    if (!formData.endDate) return 'End date is required.';
    return null;
  };

  const isIncomplete = !formData.name.trim() || !formData.destination.trim() || !formData.country.trim() || !formData.startDate || !formData.endDate;

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />

      {/* Live preview hero */}
      {previewImage ? (
        <Image source={{ uri: previewImage }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder, { backgroundColor: theme.tagBackground }]}>
          <Ionicons name="airplane" size={40} color={theme.textSecondary} />
          <Text style={[styles.heroText, { color: theme.textSecondary }]}>
            {formData.destination ? 'Loading preview...' : 'Enter a destination to see a preview'}
          </Text>
        </View>
      )}

      <Text style={[styles.title, { color: theme.textPrimary }]}>Plan a New Trip</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Where are you headed next?</Text>

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
          <DateField
            label="Start Date"
            value={formData.startDate}
            onChange={(d) => onChangeField('startDate', d)}
            accessibilityLabel="Trip start date"
          />
          <DateField
            label="End Date"
            value={formData.endDate}
            onChange={(d) => onChangeField('endDate', d)}
            accessibilityLabel="Trip end date"
          />
          <ImagePicker
            label="Cover Photo"
            helpText="Leave empty to use the auto-fetched preview above"
            imageUri={formData.coverImage}
            onImageSelected={(uri) => onChangeField('coverImage', uri ?? '')}
          />
        </View>

        {error ? <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text> : null}

        <PrimaryButton label="Create Trip" variant="accent" onPress={() => handleSubmit(validate())} loading={loading} disabled={isIncomplete} />
        <View style={SharedStyles.buttonSpacing}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} disabled={loading} />
        </View>
      </KeyboardAwareForm>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: BorderRadius.md,
    height: 160,
    marginBottom: Spacing.lg,
    width: '100%',
    ...Shadows.sm,
  },
  heroPlaceholder: {
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
});
