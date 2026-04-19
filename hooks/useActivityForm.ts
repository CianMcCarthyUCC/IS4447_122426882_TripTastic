import { useState, useCallback, useMemo } from 'react';
import { useTripContext } from '@/context/TripContext';
import type { ActivityFormData } from '@/types';

/**
 * Reusable form state hook for activity forms (add & edit).
 * Defaults tripId to the currently selected trip.
 */
export function useActivityForm(initial?: ActivityFormData) {
  const { currentTrip } = useTripContext();

  // Memoised so `resetForm` below has a stable reference — otherwise a
  // fresh object literal on every render would defeat the useCallback.
  const defaultForm = useMemo<ActivityFormData>(
    () =>
      initial ?? {
        tripId: currentTrip?.id ?? 1,
        categoryId: 0,
        date: '',
        metric: '',
        status: 'planned',
        notes: '',
      },
    [initial, currentTrip?.id],
  );

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
