import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCategories, useCategoryForm } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Add category screen — thin shell. Validates required fields before saving.
 */
export default function AddCategory() {
  const router = useRouter();
  const { addCategory } = useCategories();
  const { formData, onChangeField } = useCategoryForm();
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }
    setError('');
    await addCategory(formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Add Category" subtitle="Create a new category." />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Category"
        error={error}
      />
    </ScreenContainer>
  );
}
