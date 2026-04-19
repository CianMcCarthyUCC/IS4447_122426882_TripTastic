import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useActivities, useActivityForm, useCategories, useFormSubmit, useTrips } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { ActivityForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import { validateActivityForm } from '@/utils/validation';
import { geocodeCity } from '@/utils/geocode';
import { consumePickedPlace } from '@/utils/placePickerBridge';

export default function AddActivity() {
  const router = useRouter();
  const { addActivity } = useActivities();
  const { categories } = useCategories();
  const { currentTrip } = useTrips();
  const { formData, onChangeField } = useActivityForm();
  const mounted = useMountedRef();

  const [tripCoords, setTripCoords] = useState<{ lat: number; lon: number } | null>(null);

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

  // When returning from the picker, pull the selection out of the bridge and
  // populate the form's notes + category.
  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedPlace();
      if (picked) {
        onChangeField('notes', picked.name);
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

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => addActivity(formData), 'Activity added');

  return (
    <SlideUpSheet
      title="Log Activity"
      subtitle="Record something from your trip."
      onClose={() => router.back()}
    >
      <Toast {...toast} onHide={hideToast} />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateActivityForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Activity"
        loading={loading}
        categories={categories}
        error={error}
        onPickPlace={tripCoords ? openPlacePicker : undefined}
      />
    </SlideUpSheet>
  );
}
