import { useState, useCallback } from 'react';
import type { StudentFormData } from '@/types';

const EMPTY_FORM: StudentFormData = { name: '', major: '', year: '' };

/**
 * Reusable form state hook for student forms (add & edit).
 * Write once, reuse in every screen that needs a student form.
 */
export function useStudentForm(initial: StudentFormData = EMPTY_FORM) {
  const [formData, setFormData] = useState<StudentFormData>(initial);

  const onChangeField = useCallback(
    (field: keyof StudentFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
  }, []);

  const populateForm = useCallback((data: StudentFormData) => {
    setFormData(data);
  }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
