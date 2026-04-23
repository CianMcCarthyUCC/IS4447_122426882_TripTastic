import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useActivities, useActivityForm, useCategories, useFormSubmit, useTrips } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { EditEntityScreen } from '@/components/layout';
import { isPastTrip } from '@/utils/dateHelpers';

export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, updateActivity } = useActivities();
  const { categories } = useCategories();
  const { trips } = useTrips();
  const { formData, onChangeField, populateForm } = useActivityForm();

  const activity = findActivityById(Number(id));
  const trip = activity ? trips.find((t) => t.id === activity.tripId) : undefined;
  const tripIsPast = !!trip && isPastTrip(trip.endDate);

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => updateActivity(Number(id), formData), 'Activity updated');

  useEffect(() => {
    if (!activity) return;
    populateForm({
      tripId: activity.tripId, categoryId: activity.categoryId,
      date: activity.date, metric: String(activity.metric), status: activity.status ?? 'planned',
      place: activity.place ?? '', notes: activity.notes ?? '',
    });
  }, [activity?.id, populateForm]);

  if (!activity) return null;

  return (
    <EditEntityScreen title="Edit Activity" toast={toast} onHideToast={hideToast}>
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        // ActivityForm now owns per-field validation; pass `null` to
        // bypass useFormSubmit's string-error gate.
        onSubmit={() => handleSubmit(null)}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        categories={categories}
        error={error}
        isPastTrip={tripIsPast}
      />
    </EditEntityScreen>
  );
}
