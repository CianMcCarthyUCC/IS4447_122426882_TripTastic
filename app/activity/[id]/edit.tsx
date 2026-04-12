import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useActivities, useActivityForm, useCategories } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Edit activity screen — reuses ActivityForm. Validates required fields.
 */
export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, updateActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField, populateForm } = useActivityForm();
  const [error, setError] = useState('');

  const activity = findActivityById(Number(id));

  useEffect(() => {
    if (!activity) return;
    populateForm({
      tripId: activity.tripId,
      categoryId: activity.categoryId,
      date: activity.date,
      metric: String(activity.metric),
      notes: activity.notes ?? '',
    });
  }, [activity?.id, populateForm]);

  if (!activity) return null;

  const handleSubmit = async () => {
    if (!formData.date || !formData.metric || !formData.categoryId) {
      setError('Date, duration, and category are required.');
      return;
    }
    setError('');
    await updateActivity(Number(id), formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Edit Activity" subtitle={`Update activity on ${activity.date}`} />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
