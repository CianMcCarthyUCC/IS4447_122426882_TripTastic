import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useActivities, useActivityForm, useCategories, useFormSubmit } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateActivityForm } from '@/utils/validation';

export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, updateActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField, populateForm } = useActivityForm();

  const activity = findActivityById(Number(id));

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => updateActivity(Number(id), formData), 'Activity updated');

  useEffect(() => {
    if (!activity) return;
    populateForm({
      tripId: activity.tripId, categoryId: activity.categoryId,
      date: activity.date, metric: String(activity.metric), status: activity.status ?? 'planned', notes: activity.notes ?? '',
    });
  }, [activity?.id, populateForm]);

  if (!activity) return null;

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Edit Activity" subtitle={`Update activity on ${activity.date}`} />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateActivityForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
