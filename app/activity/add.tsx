import { useRouter } from 'expo-router';
import { useActivities, useActivityForm, useCategories, useFormSubmit } from '@/hooks';
import { ActivityForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateActivityForm } from '@/utils/validation';

export default function AddActivity() {
  const router = useRouter();
  const { addActivity } = useActivities();
  const { categories } = useCategories();
  const { formData, onChangeField } = useActivityForm();

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => addActivity(formData), 'Activity added');

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Log Activity" subtitle="Record something from your trip." />
      <ActivityForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateActivityForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Activity"
        loading={loading}
        categories={categories}
        error={error}
      />
    </ScreenContainer>
  );
}
