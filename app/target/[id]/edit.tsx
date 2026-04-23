import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTargets, useTargetForm, useCategories, useFormSubmit } from '@/hooks';
import { TargetForm } from '@/components/forms';
import { EditEntityScreen } from '@/components/layout';
import { validateTargetForm } from '@/utils/validation';

export default function EditTarget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTargetById, updateTarget } = useTargets();
  const { categories } = useCategories();
  const { formData, onChangeField, populateForm } = useTargetForm();

  const target = findTargetById(Number(id));

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => updateTarget(Number(id), formData), 'Goal updated');

  useEffect(() => {
    if (!target) return;
    populateForm({
      tripId: target.tripId, categoryId: target.categoryId,
      targetValue: String(target.targetValue), period: target.period,
      notes: target.notes ?? '',
    });
  }, [target?.id, populateForm]);

  if (!target) return null;

  return (
    <EditEntityScreen title="Edit Goal" toast={toast} onHideToast={hideToast}>
      <TargetForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateTargetForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        categories={categories}
        error={error}
      />
    </EditEntityScreen>
  );
}
