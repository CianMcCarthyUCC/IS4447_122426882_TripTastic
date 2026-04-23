import { useRouter } from 'expo-router';
import { useCategories, useCategoryForm, useFormSubmit } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { AddEntitySheet } from '@/components/layout';
import { validateCategoryForm } from '@/utils/validation';

export default function AddCategory() {
  const router = useRouter();
  const { addCategory } = useCategories();
  const { formData, onChangeField } = useCategoryForm();

  const { error, loading, handleSubmit, toast, hideToast } = useFormSubmit(
    async () => {
      await addCategory(formData);
    },
    'Category created',
  );

  return (
    <AddEntitySheet title="New Category" onClose={() => router.back()} toast={toast} onHideToast={hideToast}>
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateCategoryForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Category"
        loading={loading}
        error={error}
      />
    </AddEntitySheet>
  );
}
