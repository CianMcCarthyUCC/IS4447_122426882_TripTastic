import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useCategories, useCategoryForm } from '@/hooks';
import { CategoryForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Edit category screen — reuses CategoryForm. Validates required fields.
 */
export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, updateCategory } = useCategories();
  const { formData, onChangeField, populateForm } = useCategoryForm();
  const [error, setError] = useState('');

  const category = findCategoryById(Number(id));

  useEffect(() => {
    if (!category) return;
    populateForm({ name: category.name, color: category.color, icon: category.icon });
  }, [category?.id, populateForm]);

  if (!category) return null;

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }
    setError('');
    await updateCategory(Number(id), formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Edit Category" subtitle={`Update ${category.name}`} />
      <CategoryForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
        error={error}
      />
    </ScreenContainer>
  );
}
