import type { Activity, Category, Target } from '@/types';

export type StreakInfo = {
  categoryId: number;
  categoryName: string;
  currentStreak: number;
  longestStreak: number;
  unit: 'days' | 'weeks';
};

/**
 * Computes streak data — consecutive days with logged activities per category.
 * A "streak day" means at least one activity was logged for that category on that date.
 */
export function computeStreaks(
  activities: Activity[],
  targets: Target[],
  categoryLookup: Map<number, Category>,
): StreakInfo[] {
  // Group activities by categoryId → sorted unique dates
  const categoryDates = new Map<number, string[]>();
  for (const a of activities) {
    const dates = categoryDates.get(a.categoryId) ?? [];
    if (!dates.includes(a.date)) dates.push(a.date);
    categoryDates.set(a.categoryId, dates);
  }

  const results: StreakInfo[] = [];

  for (const [categoryId, dates] of categoryDates) {
    const sorted = dates.sort();
    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    // Check if streak is still active (last date is today or yesterday)
    const lastDate = new Date(sorted[sorted.length - 1] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceLast = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
    currentStreak = daysSinceLast <= 1 ? tempStreak : 0;

    results.push({
      categoryId,
      categoryName: categoryLookup.get(categoryId)?.name ?? 'Unknown',
      currentStreak,
      longestStreak,
      unit: 'days',
    });
  }

  return results.sort((a, b) => b.currentStreak - a.currentStreak);
}
