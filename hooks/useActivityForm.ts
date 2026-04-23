import { useState, useCallback, useMemo } from 'react';
import { useTripContext } from '@/context/TripContext';
import { isPastTrip } from '@/utils/dateHelpers';
import type { ActivityFormData } from '@/types';

/**
 * Holds the form state for the Activity form, shared by the add-activity
 * and edit-activity screens. Pre-fills the trip with whichever one the
 * user is currently viewing.
 */
export function useActivityForm(initial?: ActivityFormData) {
  const { currentTrip } = useTripContext();

  // Memoised so `resetForm` below has a stable reference - otherwise a
  // fresh object literal on every render would defeat the useCallback.
  const defaultForm = useMemo<ActivityFormData>(
    () =>
      initial ?? {
        tripId: currentTrip?.id ?? 1,
        categoryId: 0,
        date: '',
        metric: '',
        // Past trips can only hold completed activities - seeding the
        // default here means the form opens in the right state before
        // the user sees the (locked) status field.
        status: currentTrip && isPastTrip(currentTrip.endDate) ? 'completed' : 'planned',
        place: '',
        notes: '',
      },
    [initial, currentTrip?.id, currentTrip?.endDate],
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
