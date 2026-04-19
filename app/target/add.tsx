import { useRouter } from 'expo-router';
import { useTargets, useTargetForm, useCategories, useFormSubmit } from '@/hooks';
import { TargetForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import { validateTargetForm } from '@/utils/validation';

export default function AddTarget() {
  const router = useRouter();
  const { addTarget } = useTargets();
  const { categories } = useCategories();
  const { formData, onChangeField } = useTargetForm();

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => addTarget(formData), 'Goal created');

  return (
    <SlideUpSheet
      title="New Goal"
      subtitle="Set a weekly or monthly target for your trip."
      onClose={() => router.back()}
    >
      <Toast {...toast} onHide={hideToast} />
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
    </SlideUpSheet>
  );
}
