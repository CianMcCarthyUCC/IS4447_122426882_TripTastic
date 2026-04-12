import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useActivities, useActivityForm, useCategories, useToast, useHaptics } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateActivityForm } from '@/utils/validation';

/**
 * Edit activity screen — reuses ActivityForm with shared validation.
 */
export default function EditActivity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, updateActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField, populateForm } = useActivityForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    const validationError = validateActivityForm(formData);
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    await updateActivity(Number(id), formData);
    haptics.success();
    showToast('Activity updated', 'success');
    router.back();
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Edit Activity" subtitle={`Update activity on ${activity.date}`} />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={loading ? 'Saving...' : 'Save Changes'}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
