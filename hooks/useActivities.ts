import { useCallback } from 'react';
import { useActivityContext } from '@/context';
import { getAllActivities, insertActivity, updateActivityById, deleteActivityById } from '@/db';
import type { ActivityFormData } from '@/types';

/**
 * Central hook for all activity CRUD operations.
 * Handles DATA only — no navigation.
 */
export function useActivities() {
  const { activities, setActivities } = useActivityContext();

  const refreshActivities = useCallback(async () => {
    const rows = await getAllActivities();
    setActivities(rows);
  }, [setActivities]);

  const addActivity = useCallback(
    async (formData: ActivityFormData) => {
      await insertActivity(formData);
      await refreshActivities();
    },
    [refreshActivities],
  );

  const updateActivity = useCallback(
    async (id: number, formData: ActivityFormData) => {
      await updateActivityById(id, formData);
      await refreshActivities();
    },
    [refreshActivities],
  );

  const deleteActivity = useCallback(
    async (id: number) => {
      await deleteActivityById(id);
      await refreshActivities();
    },
    [refreshActivities],
  );

  const findActivityById = useCallback(
    (id: number) => {
      return activities.find((a) => a.id === id);
    },
    [activities],
  );

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    findActivityById,
    refreshActivities,
  };
}
