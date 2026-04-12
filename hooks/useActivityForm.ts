import { useState, useCallback } from 'react';
import type { ActivityFormData } from '@/types';

const EMPTY_FORM: ActivityFormData = {
  tripId: 1,
  categoryId: 0,
  date: '',
  metric: '',
  notes: '',
};

/**
 * Reusable form state hook for activity forms (add & edit).
 */
export function useActivityForm(initial: ActivityFormData = EMPTY_FORM) {
  const [formData, setFormData] = useState<ActivityFormData>(initial);

  const onChangeField = useCallback(
    (field: keyof ActivityFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
  }, []);

  const populateForm = useCallback((data: ActivityFormData) => {
    setFormData(data);
  }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
