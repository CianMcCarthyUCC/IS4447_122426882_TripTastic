import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useActivities, useActivityForm, useCategories } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Add activity screen — thin shell. Validates required fields before saving.
 */
export default function AddActivity() {
  const router = useRouter();
  const { addActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField } = useActivityForm();
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.date || !formData.metric || !formData.categoryId) {
      setError('Date, duration, and category are required.');
      return;
    }
    setError('');
    await addActivity(formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Add Activity" subtitle="Record a new activity." />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Activity"
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
