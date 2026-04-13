import { useRouter } from 'expo-router';
import { useTargets, useTargetForm, useCategories, useFormSubmit } from '@/hooks';
import { TargetForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateTargetForm } from '@/utils/validation';

export default function AddTarget() {
  const router = useRouter();
  const { addTarget } = useTargets();
  const { categories } = useCategories();
  const { formData, onChangeField } = useTargetForm();

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => addTarget(formData), 'Goal created');

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="New Goal" subtitle="Set a weekly or monthly target for your trip." />
      <TargetForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateTargetForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Goal"
        loading={loading}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
