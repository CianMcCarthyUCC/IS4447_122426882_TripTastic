import { useEffect, useRef } from 'react';
import { useActivityContext } from '@/context/ActivityContext';
import { computeStreaks } from '@/utils/streakCalculator';
import { notifyStreakIncrease } from '@/utils/notifications';

/**
 * Celebrates each new day added to the user's streak. Only fires when
 * the streak actually grows in the current session, so existing
 * streaks don't re-trigger on every app launch.
 */
export function useStreakNotifications() {
  const { activities } = useActivityContext();
  // `null` = haven't measured yet. Seeded on the first effect run so the
  // initial observed streak is treated as the baseline, not an increase.
  const lastStreak = useRef<number | null>(null);

  useEffect(() => {
    const { currentStreak } = computeStreaks(activities);

    if (lastStreak.current === null) {
      lastStreak.current = currentStreak;
      return;
    }

    if (currentStreak > lastStreak.current) {
      void notifyStreakIncrease(currentStreak);
    }
    lastStreak.current = currentStreak;
  }, [activities]);
}
