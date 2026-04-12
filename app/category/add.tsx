import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCategories, useCategoryForm, useToast, useHaptics } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { validateCategoryForm } from '@/utils/validation';

/**
 * Add category screen — validates with shared utility before saving.
 */
export default function AddCategory() {
  const router = useRouter();
  const { addCategory } = useCategories();
  const { formData, onChangeField } = useCategoryForm();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateCategoryForm(formData);
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    await addCategory(formData);
    haptics.success();
    showToast('Category created', 'success');
    router.back();
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title="Add Category" subtitle="Create a new category." />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={loading ? 'Saving...' : 'Save Category'}
        error={error}
      />
    </ScreenContainer>
  );
}
