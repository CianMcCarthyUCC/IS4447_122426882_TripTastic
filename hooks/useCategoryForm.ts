import { useState, useCallback } from 'react';
import type { CategoryFormData } from '@/types';

const EMPTY_FORM: CategoryFormData = { name: '', color: '#3B82F6', icon: 'eye' };

/**
 * Holds the form state for the Category form, shared by the add-category
 * and edit-category screens.
 */
export function useCategoryForm(initial: CategoryFormData = EMPTY_FORM) {
  const [formData, setFormData] = useState<CategoryFormData>(initial);

  const onChangeField = useCallback(
    (field: keyof CategoryFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
  }, []);

  const populateForm = useCallback((data: CategoryFormData) => {
    setFormData(data);
  }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
