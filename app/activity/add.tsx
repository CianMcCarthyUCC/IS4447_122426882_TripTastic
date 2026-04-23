import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useActivities, useActivityForm, useCategories, useFormSubmit, useTrips } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { ActivityForm } from '@/components/forms';
import { SlideUpSheet } from '@/components/modals';
import { geocodeCity } from '@/utils/geocode';
import { consumePickedPlace } from '@/utils/placePickerBridge';
import { isPastTrip } from '@/utils/dateHelpers';

/**
 * The Log Activity screen. Opens as a bottom sheet, runs the user
 * through the two-step activity form and shows a short celebratory
 * overlay on save before returning them to the trip.
 */
export default function AddActivity() {
  const router = useRouter();
  const { addActivity } = useActivities();
  const { categories } = useCategories();
  const { currentTrip } = useTrips();
  const { formData, onChangeField } = useActivityForm();
  const mounted = useMountedRef();

  const [tripCoords, setTripCoords] = useState<{ lat: number; lon: number } | null>(null);
  const tripIsPast = !!currentTrip && isPastTrip(currentTrip.endDate);

  // Resolve the current trip's destination → coords so we can open the picker.
  useEffect(() => {
    if (!currentTrip?.destination) return;
    let cancelled = false;
    void (async () => {
      const coords = await geocodeCity(currentTrip.destination, currentTrip.country);
      if (cancelled || !mounted.current) return;
      setTripCoords(coords ? { lat: coords.latitude, lon: coords.longitude } : null);
    })();
    return () => { cancelled = true; };
  }, [currentTrip?.destination, currentTrip?.country, mounted]);

  // When returning from the picker, populate the form's place + category.
  // Notes stays untouched so the user can still capture their own blurb
  // on top of the venue.
  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedPlace();
      if (picked) {
        onChangeField('place', picked.name);
        onChangeField('categoryId', picked.categoryId);
      }
    }, [onChangeField]),
  );

  const openPlacePicker = useCallback(() => {
    if (!tripCoords) return;
    router.push({
      pathname: '/place-picker',
      params: { lat: String(tripCoords.lat), lon: String(tripCoords.lon) },
    });
  }, [router, tripCoords]);

  const { error, loading, handleSubmit } = useFormSubmit(
    () => addActivity(formData),
    formData.status === 'planned' ? 'Added to your plan' : 'Activity logged',
  );

  // ActivityForm handles its own validation + wizard navigation; all we
  // need to do here is the async save. Passing `null` as the validation
  // error short-circuits useFormSubmit's own gate because the form has
  // already confirmed the data is valid by the time it calls onSubmit.
  const onSave = useCallback(() => {
    handleSubmit(null);
  }, [handleSubmit]);

  return (
    <SlideUpSheet
      title="Log Activity"
      subtitle={
        formData.status === 'planned'
          ? 'Plan something for your trip.'
          : 'Record something from your trip.'
      }
      onClose={() => router.back()}
    >
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={onSave}
        onCancel={() => router.back()}
        submitLabel="Save Activity"
        loading={loading}
        categories={categories}
        error={error}
        onPickPlace={tripCoords ? openPlacePicker : undefined}
        isPastTrip={tripIsPast}
      />
    </SlideUpSheet>
  );
}
