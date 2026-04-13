import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTargets, useTargetForm, useCategories, useToast, useHaptics } from '@/hooks';
import { TargetForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateTargetForm } from '@/utils/validation';

/**
 * Edit target screen — reuses TargetForm with shared validation.
 */
export default function EditTarget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTargetById, updateTarget } = useTargets();
  const { categories } = useCategories();
  const { formData, onChangeField, populateForm } = useTargetForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const target = findTargetById(Number(id));

  useEffect(() => {
    if (!target) return;
    populateForm({
      tripId: target.tripId,
      categoryId: target.categoryId,
      targetValue: String(target.targetValue),
      period: target.period,
    });
  }, [target?.id, populateForm]);

  if (!target) return null;

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
      await updateTarget(Number(id), formData);
      haptics.success();
      showToast('Target updated', 'success');
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
      <ScreenHeader title="Edit Goal" subtitle="Update your goal." />
      <TargetForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
