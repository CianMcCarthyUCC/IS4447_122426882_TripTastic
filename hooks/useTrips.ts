import { useCallback } from 'react';
import { useTripContext } from '@/context/TripContext';
import { getAllTrips, insertTrip, updateTripById, deleteTripById } from '@/db';
import type { TripFormData } from '@/types';

/**
 * The central hook for reading and changing trips. Also tracks which
 * trip the user is currently working with across the app.
 */
export function useTrips() {
  const { trips, setTrips, currentTrip, setCurrentTrip } = useTripContext();

  const refreshTrips = useCallback(async () => {
    const rows = await getAllTrips();
    setTrips(rows);
    // If current trip was deleted, select first available
    if (currentTrip && !rows.find((t) => t.id === currentTrip.id)) {
      setCurrentTrip(rows[0] ?? null);
    }
  }, [setTrips, currentTrip, setCurrentTrip]);

  const addTrip = useCallback(async (formData: TripFormData) => {
    await insertTrip(formData);
    await refreshTrips();
  }, [refreshTrips]);

  const updateTrip = useCallback(async (id: number, formData: TripFormData) => {
    await updateTripById(id, formData);
    await refreshTrips();
  }, [refreshTrips]);

  const deleteTrip = useCallback(async (id: number) => {
    await deleteTripById(id);
    await refreshTrips();
  }, [refreshTrips]);

  const findTripById = useCallback(
    (id: number) => trips.find((t) => t.id === id),
    [trips],
  );

  const selectTrip = useCallback(
    (id: number) => {
      const trip = trips.find((t) => t.id === id);
      if (trip) setCurrentTrip(trip);
    },
    [trips, setCurrentTrip],
  );

  return {
    trips,
    currentTrip,
    addTrip,
    updateTrip,
    deleteTrip,
    findTripById,
    selectTrip,
    refreshTrips,
  };
}
