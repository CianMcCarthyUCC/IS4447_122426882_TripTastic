import { useState, useCallback } from 'react';
import type { TargetFormData } from '@/types';

const EMPTY_FORM: TargetFormData = {
  tripId: 1,
  categoryId: 0,
  targetValue: '',
  period: 'weekly',
  notes: '',
};

/**
 * Holds the form state for the Goal form, shared by the add-goal and
 * edit-goal screens.
 */
export function useTargetForm(initial: TargetFormData = EMPTY_FORM) {
  const [formData, setFormData] = useState<TargetFormData>(initial);

  const onChangeField = useCallback(
    (field: keyof TargetFormData, value: string | number | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
  }, []);

  const populateForm = useCallback((data: TargetFormData) => {
    setFormData(data);
  }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
