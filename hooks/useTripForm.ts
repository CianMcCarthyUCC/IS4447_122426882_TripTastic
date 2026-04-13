import { useState, useCallback } from 'react';
import type { TripFormData } from '@/types';

const EMPTY_FORM: TripFormData = {
  name: '',
  destination: '',
  country: '',
  coverImage: null,
  startDate: '',
  endDate: '',
};

/**
 * Reusable form state hook for trip forms (add & edit).
 */
export function useTripForm(initial: TripFormData = EMPTY_FORM) {
  const [formData, setFormData] = useState<TripFormData>(initial);

  const onChangeField = useCallback(
    (field: keyof TripFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => { setFormData(EMPTY_FORM); }, []);

  const populateForm = useCallback((data: TripFormData) => { setFormData(data); }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
