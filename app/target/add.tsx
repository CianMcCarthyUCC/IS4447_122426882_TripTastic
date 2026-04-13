import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTargets, useTargetForm, useCategories, useToast, useHaptics } from '@/hooks';
import { TargetForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateTargetForm } from '@/utils/validation';

/**
 * Add target screen — validates with shared utility before saving.
 */
export default function AddTarget() {
  const router = useRouter();
  const { addTarget } = useTargets();
  const { categories } = useCategories();
  const { formData, onChangeField } = useTargetForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateTargetForm(formData);
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addTarget(formData);
      haptics.success();
      showToast('Target created', 'success');
      router.back();
    } catch {
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="New Goal" subtitle="Set a weekly or monthly target for your trip." />
      <TargetForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Target"
        loading={loading}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
