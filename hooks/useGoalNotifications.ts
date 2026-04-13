import { useEffect, useRef } from 'react';
import { useActivityContext } from '@/context/ActivityContext';
import { useTargetContext } from '@/context/TargetContext';
import { useCategoryContext } from '@/context/CategoryContext';
import { computeTargetCurrentValue } from '@/utils/progressHelpers';
import { notifyGoalMet, scheduleGoalReminder } from '@/utils/notifications';

/**
 * Watches activity changes and fires notifications when goals are met.
 * Tracks which goals have already been notified to avoid duplicates.
 * Also schedules reminders for goals that are close but not yet met.
 */
export function useGoalNotifications() {
  const { activities } = useActivityContext();
  const { targets } = useTargetContext();
  const { categories } = useCategoryContext();
  const notifiedGoals = useRef(new Set<number>());

  useEffect(() => {
    if (activities.length === 0 || targets.length === 0) return;

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    for (const target of targets) {
      const current = computeTargetCurrentValue(target, activities);
      const goalName = categoryMap.get(target.categoryId) ?? 'Unknown';
      const met = current >= target.targetValue;
      const exceeded = current > target.targetValue;
      const remaining = target.targetValue - current;
      const closeToGoal = remaining > 0 && remaining <= target.targetValue * 0.2; // within 20%

      // Fire notification when goal is met for the first time
      if (met && !notifiedGoals.current.has(target.id)) {
        notifiedGoals.current.add(target.id);
        void notifyGoalMet(goalName, exceeded);
      }

      // Schedule a reminder for goals that are close but not met
      if (closeToGoal && !notifiedGoals.current.has(-target.id)) {
        notifiedGoals.current.add(-target.id); // negative id = reminder sent
        void scheduleGoalReminder(goalName, remaining);
      }
    }
  }, [activities, targets, categories]);
}
