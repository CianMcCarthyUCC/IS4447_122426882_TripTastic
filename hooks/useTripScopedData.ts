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
 * Returns everything that belongs to a given trip (its activities,
 * goals and stats). Keeps the rule for "what belongs to this trip" in
 * one place so every screen agrees.
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
