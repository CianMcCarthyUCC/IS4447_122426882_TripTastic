import { useMemo } from 'react';
import { useActivities } from './useActivities';
import { useTargets } from './useTargets';
import type { Activity, Target } from '@/types';

type TripScopedData = {
  /** Activities belonging to this trip only. */
  activities: Activity[];
  /** Targets scoped to this trip OR global (tripId === null). */
  targets: Target[];
  /** Count of activities with status === 'completed'. */
  completedCount: number;
  /** Sum of `metric` across all scoped activities. */
  totalMinutes: number;
};

/**
 * Single source of truth for "everything tied to trip X" selections over the
 * in-memory context. Replaces ad-hoc `activities.filter(a => a.tripId === id)`
 * duplicated across trip detail + insights + streaks, so the filter rule
 * (including the `targets.tripId === null` global-target convention) lives
 * in one place.
 */
export function useTripScopedData(tripId: number): TripScopedData {
  const { activities } = useActivities();
  const { targets } = useTargets();

  return useMemo(() => {
    const scopedActivities = activities.filter((a) => a.tripId === tripId);
    const scopedTargets = targets.filter((t) => t.tripId === tripId || t.tripId === null);
    const completedCount = scopedActivities.filter((a) => a.status === 'completed').length;
    const totalMinutes = scopedActivities.reduce((sum, a) => sum + a.metric, 0);

    return {
      activities: scopedActivities,
      targets: scopedTargets,
      completedCount,
      totalMinutes,
    };
  }, [activities, targets, tripId]);
}
