import { useRouter } from 'expo-router';
import { useCategories, useCategoryForm, useFormSubmit } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import { validateCategoryForm } from '@/utils/validation';

export default function AddCategory() {
  const router = useRouter();
  const { addCategory } = useCategories();
  const { formData, onChangeField } = useCategoryForm();

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => addCategory(formData), 'Category created');

  return (
    <SlideUpSheet
      title="New Category"
      subtitle="Organise your trip activities by type."
      onClose={() => router.back()}
    >
      <Toast {...toast} onHide={hideToast} />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateCategoryForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Category"
        loading={loading}
        error={error}
      />
    </SlideUpSheet>
  );
}
