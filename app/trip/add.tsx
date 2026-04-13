import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import { useTrips, useTripForm, useFormSubmit } from '@/hooks';
import { FormField, DateField, ImagePicker } from '@/components/forms';
import { PrimaryButton } from '@/components/buttons';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer, KeyboardAwareForm } from '@/components/layout';
import { SharedStyles } from '@/constants';
import { getDestinationPhoto } from '@/utils/unsplashApi';

export default function AddTrip() {
  const router = useRouter();
  const { addTrip } = useTrips();
  const { formData, onChangeField } = useTripForm();

  const submitTrip = async () => {
    // Auto-fetch cover image from Unsplash if user didn't pick one
    let finalData = { ...formData };
    if (!finalData.coverImage && finalData.destination.trim()) {
      const photo = await getDestinationPhoto(finalData.destination);
      if (photo) finalData = { ...finalData, coverImage: photo };
    }
    await addTrip(finalData);
  };

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
      <ScreenHeader title="New Trip" subtitle="Plan your next holiday adventure." />
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
            helpText="Used for weather forecast and cover photo"
            value={formData.destination}
            onChangeText={(v) => onChangeField('destination', v)}
            placeholder="e.g. Rome"
          />
          <FormField
            label="Country"
            helpText="Used for currency, language, and timezone info"
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
            helpText="Optional — a travel photo will be added automatically if left empty"
            imageUri={formData.coverImage}
            onImageSelected={(uri) => onChangeField('coverImage', uri ?? '')}
          />
        </View>

        {error ? <Text style={SharedStyles.errorText} accessibilityRole="alert">{error}</Text> : null}

        <PrimaryButton label="Create Trip" onPress={() => handleSubmit(validate())} loading={loading} disabled={isIncomplete} />
        <View style={SharedStyles.buttonSpacing}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} disabled={loading} />
        </View>
      </KeyboardAwareForm>
    </ScreenContainer>
  );
}
