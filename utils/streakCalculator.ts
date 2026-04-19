import type { Activity } from '@/types';

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  unit: 'days';
};

/**
 * Global activity streak — consecutive days where the user hit the implicit
 * daily target of "log at least one activity". Returns a single streak across
 * all categories rather than per-category; this matches the rubric criterion
 * ("consecutive days where targets are met") with a binary per-day target.
 *
 * `currentStreak` is only non-zero if the streak is still live today — i.e.
 * the most recent logged day is today or yesterday. Logging a gap-day resets
 * the count but `longestStreak` retains the best run the user has achieved.
 */
export function computeStreaks(activities: Activity[]): StreakInfo {
  if (activities.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unit: 'days' };
  }

  // De-dupe dates — multiple activities on the same day count as one streak
  // day. Sorted ascending so the diff-walk below can just compare i-1 to i.
  const uniqueDates = Array.from(new Set(activities.map((a) => a.date))).sort();

  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  // Streak only counts as "current" if the last activity was today or
  // yesterday — anything older means the chain is broken. Yesterday still
  // counts so a user who hasn't logged yet today doesn't lose credit.
  const lastDate = new Date(uniqueDates[uniqueDates.length - 1] + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
  const currentStreak = daysSinceLast <= 1 ? tempStreak : 0;

  return { currentStreak, longestStreak, unit: 'days' };
}
