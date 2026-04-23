import type { Activity } from '@/types';

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  unit: 'days';
};

/**
 * Works out the user's completion streak from their activities. A day
 * counts towards the streak when every activity planned for that day
 * was completed. Also reports the longest streak ever recorded.
 */
export function computeStreaks(activities: Activity[]): StreakInfo {
  if (activities.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unit: 'days' };
  }

  // Aggregate per day: how many activities planned and how many done.
  const perDay = new Map<string, { total: number; done: number }>();
  for (const a of activities) {
    const entry = perDay.get(a.date) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (a.status === 'completed') entry.done += 1;
    perDay.set(a.date, entry);
  }

  const hitDates = Array.from(perDay.entries())
    .filter(([, v]) => v.total > 0 && v.done === v.total)
    .map(([k]) => k)
    .sort();

  if (hitDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unit: 'days' };
  }

  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < hitDates.length; i++) {
    const prev = new Date(hitDates[i - 1] + 'T00:00:00');
    const curr = new Date(hitDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) tempStreak++;
    else tempStreak = 1;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  const lastDate = new Date(hitDates[hitDates.length - 1] + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
  const currentStreak = daysSinceLast <= 1 ? tempStreak : 0;

  return { currentStreak, longestStreak, unit: 'days' };
}
