import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useCategories, useCategoryForm, useFormSubmit } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
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

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Edit Category" subtitle={`Update ${category.name}`} />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={() => handleSubmit(validateCategoryForm(formData))}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
      />
    </ScreenContainer>
  );
}
