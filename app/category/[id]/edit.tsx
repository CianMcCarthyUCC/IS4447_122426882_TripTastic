import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCategories, useCategoryForm, useFormSubmit } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { EditEntityScreen } from '@/components/layout';
import { validateCategoryForm } from '@/utils/validation';

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, updateCategory } = useCategories();
  const { formData, onChangeField, populateForm } = useCategoryForm();

  const category = findCategoryById(Number(id));

  const { error, loading, handleSubmit, toast, hideToast } =
    useFormSubmit(() => updateCategory(Number(id), formData), 'Category updated');

  useEffect(() => {
    if (!category) return;
    populateForm({ name: category.name, color: category.color, icon: category.icon });
  }, [category?.id, populateForm]);

  if (!category) return null;
  // The Unspecified system category is the fallback that receives items
  // when another category is deleted - its identity has to stay stable,
  // so the edit screen bounces back if someone deep-links here.
  if (category.isSystem) {
    router.back();
    return null;
  }

  return (
    <EditEntityScreen title="Edit Category" toast={toast} onHideToast={hideToast}>
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateCategoryForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
      />
    </EditEntityScreen>
  );
}
