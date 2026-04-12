import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useActivities, useActivityForm, useCategories, useToast, useHaptics } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateActivityForm } from '@/utils/validation';

/**
 * Add activity screen — validates with shared utility before saving.
 */
export default function AddActivity() {
  const router = useRouter();
  const { addActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField } = useActivityForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateActivityForm(formData);
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    await addActivity(formData);
    haptics.success();
    showToast('Activity added', 'success');
    setTimeout(() => router.back(), 600);
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Add Activity" subtitle="Record a new activity." />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={loading ? 'Saving...' : 'Save Activity'}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
