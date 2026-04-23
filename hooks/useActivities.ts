import { useCallback } from 'react';
import { useActivityContext } from '@/context';
import {
  getAllActivities,
  insertActivity,
  updateActivityById,
  deleteActivityById,
  deleteActivitiesByTripId,
  setFavouriteActivity,
  unsetFavouriteActivity,
  setActivityStatus,
} from '@/db';
import type { Activity, ActivityFormData } from '@/types';

/**
 * The central hook for reading and changing activities. Covers creating,
 * updating, deleting and marking favourites so every screen touches
 * activity data through one place.
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

  const clearTripActivities = useCallback(
    async (tripId: number) => {
      await deleteActivitiesByTripId(tripId);
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

  /**
   * Toggles a single activity's favourite flag. Any number of activities
   * on a trip can be starred at once; tapping an already-starred item
   * unstars it.
   */
  const toggleFavourite = useCallback(
    async (_tripId: number, activityId: number) => {
      const current = activities.find((a) => a.id === activityId);
      if (current?.isFavourite) {
        await unsetFavouriteActivity(activityId);
      } else {
        await setFavouriteActivity(activityId);
      }
      await refreshActivities();
    },
    [activities, refreshActivities],
  );

  /**
   * Flips an activity between planned and completed so the user can tick
   * an activity off (or back on) straight from the list.
   */
  const toggleComplete = useCallback(
    async (activity: Activity) => {
      const next = activity.status === 'completed' ? 'planned' : 'completed';
      await setActivityStatus(activity.id, next);
      await refreshActivities();
    },
    [refreshActivities],
  );

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    clearTripActivities,
    findActivityById,
    refreshActivities,
    toggleFavourite,
    toggleComplete,
  };
}
