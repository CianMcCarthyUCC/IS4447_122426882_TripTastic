import { useState, useCallback } from 'react';
import { useTripContext } from '@/context/TripContext';
import type { ActivityFormData } from '@/types';

/**
 * Reusable form state hook for activity forms (add & edit).
 * Defaults tripId to the currently selected trip.
 */
export function useActivityForm(initial?: ActivityFormData) {
  const { currentTrip } = useTripContext();

  const defaultForm: ActivityFormData = initial ?? {
    tripId: currentTrip?.id ?? 1,
    categoryId: 0,
    date: '',
    metric: '',
    status: 'planned',
    notes: '',
  };

  const [formData, setFormData] = useState<ActivityFormData>(defaultForm);

  const onChangeField = useCallback(
    (field: keyof ActivityFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(defaultForm);
  }, [defaultForm]);

  const populateForm = useCallback((data: ActivityFormData) => {
    setFormData(data);
  }, []);

  return { formData, onChangeField, resetForm, populateForm };
}
