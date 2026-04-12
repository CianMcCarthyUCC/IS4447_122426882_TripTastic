import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCategories, useCategoryForm, useToast, useHaptics } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Add category screen — validates required fields before saving.
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
    if (!formData.name.trim()) {
      setError('Category name is required.');
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    await addCategory(formData);
    haptics.success();
    showToast('Category created', 'success');
    setTimeout(() => router.back(), 600);
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
