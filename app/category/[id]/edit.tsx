import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useCategories, useCategoryForm, useToast, useHaptics } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateCategoryForm } from '@/utils/validation';

/**
 * Edit category screen — reuses CategoryForm. Validates required fields.
 */
export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, updateCategory } = useCategories();
  const { formData, onChangeField, populateForm } = useCategoryForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const category = findCategoryById(Number(id));

  useEffect(() => {
    if (!category) return;
    populateForm({ name: category.name, color: category.color, icon: category.icon });
  }, [category?.id, populateForm]);

  if (!category) return null;

  const handleSubmit = async () => {
    const validationError = validateCategoryForm(formData);
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    await updateCategory(Number(id), formData);
    haptics.success();
    showToast('Category updated', 'success');
    router.back();
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Edit Category" subtitle={`Update ${category.name}`} />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={loading ? 'Saving...' : 'Save Changes'}
        error={error}
      />
    </ScreenContainer>
  );
}
