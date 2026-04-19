import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useTrips, useTripForm, useFormSubmit, useAppTheme } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { FormField, DateField } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import { KeyboardAwareForm } from '@/components/layout';
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

  // Tap the hero → open the system image library. Writes straight to
  // `coverImage` so the existing auto-preview effect knows not to fetch
  // Unsplash on top of it, and so the submit path uses the user's
  // choice as-is.
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
    <SlideUpSheet
      title="Plan a New Trip"
      subtitle="Where are you headed next?"
      onClose={() => router.back()}
    >
      <Toast {...toast} onHide={hideToast} />

      {/* Live preview hero — tap to pick a photo from the library. If
          the user hasn't picked one, we auto-fetch an Unsplash image
          based on the destination. Either way, the hero is the single
          surface for the cover photo — no separate picker below. */}
      {previewImage ? (
        <Pressable
          onPress={pickHeroImage}
          accessibilityRole="button"
          accessibilityLabel="Replace cover photo"
          style={styles.heroWrapper}
        >
          <Image source={{ uri: previewImage }} style={styles.hero} />
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
          style={[styles.hero, styles.heroPlaceholder, { backgroundColor: theme.tagBackground }]}
        >
          <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
          <Text style={[styles.heroText, { color: theme.textSecondary }]}>
            {formData.destination
              ? 'Loading preview...'
              : "Tap to pick your own — or we'll grab one from your destination"}
          </Text>
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
        </View>

        {error ? <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text> : null}

        <PrimaryButton label="Create Trip" variant="accent" onPress={() => handleSubmit(validate())} loading={loading} disabled={isIncomplete} />
        <View style={SharedStyles.buttonSpacing}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} disabled={loading} />
        </View>
      </KeyboardAwareForm>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
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
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  heroText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Small pill in the corner flags that the image is the user's own
  // photo rather than an auto-fetched preview — lets users know that
  // clearing reverts to the destination-driven preview.
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
