import { Palette } from '@/constants';
import type { Activity, Target } from '@/types';

export type ProgressData = {
  percent: number;
  exceeded: boolean;
  met: boolean;
  remaining: number;
  barFillWidth: number;
  barColor: string;
};

/**
 * Pure function that computes all progress display values.
 * Used by TargetCard, ProgressCard, and target detail screen.
 */
export function computeProgress(
  current: number,
  target: number,
  accentColor?: string,
): ProgressData {
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;
  const exceeded = current > target;
  const met = current >= target && !exceeded;
  const remaining = Math.max(0, target - current);
  const barFillWidth = Math.min(percent, 100);
  const barColor = exceeded
    ? Palette.danger
    : accentColor ?? Palette.coral;

  return { percent, exceeded, met, remaining, barFillWidth, barColor };
}

/**
 * Computes the current metric sum for a target by matching activities.
 * Reused by TargetList, TargetCard, and target detail screen.
 */
export function computeTargetCurrentValue(target: Target, activities: Activity[]): number {
  return activities
    .filter((a) => {
      if (a.categoryId !== target.categoryId) return false;
      if (target.tripId !== null && a.tripId !== target.tripId) return false;
      return true;
    })
    .reduce((sum, a) => sum + a.metric, 0);
}
