import { computeTargetCurrentValue } from './progressHelpers';
import type { Activity, Category, Target, Trip } from '@/types';

/**
 * The small engine behind the "Try this filter" chips. Looks at the
 * user's data and, when a helpful filter combination would make sense,
 * returns a suggestion for the relevant list.
 */
export type FilterSuggestion<Scope extends string> = {
  scope: Scope;
  /** Copy shown inside the chip, e.g. "Focus: Food this week". */
  label: string;
  /**
   * Opaque payload the caller spreads into their filter setters. Keeping
   * this as a plain object lets each screen pick the keys it knows how
   * to consume without the helper needing to know about hook shapes.
   */
  apply: Record<string, string>;
};

/**
 * Activities: find the category the user has spent most time on in the
 * last 7 days, and if it's a clear majority (>=40%), suggest zooming in.
 */
export function suggestActivityFilter(
  activities: Activity[],
  categories: Category[],
): FilterSuggestion<'activities'> | null {
  if (activities.length === 0 || categories.length === 0) return null;

  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recent = activities.filter((a) => a.date >= cutoff);
  if (recent.length === 0) return null;

  const totals = new Map<number, number>();
  let grand = 0;
  for (const a of recent) {
    totals.set(a.categoryId, (totals.get(a.categoryId) ?? 0) + a.metric);
    grand += a.metric;
  }
  if (grand === 0) return null;

  let topCat = -1;
  let topSum = 0;
  for (const [cat, sum] of totals) {
    if (sum > topSum) {
      topSum = sum;
      topCat = cat;
    }
  }
  // Need a clear majority - otherwise the suggestion is just noise.
  if (topCat === -1 || topSum / grand < 0.4) return null;

  const catName = categories.find((c) => c.id === topCat)?.name;
  if (!catName) return null;

  return {
    scope: 'activities',
    label: `Focus: ${catName} this week`,
    apply: { selectedCategory: String(topCat), dateRange: 'week' },
  };
}

/**
 * Trips: prefer nudging toward upcoming trips (most actionable). If
 * there are none, fall back to filtering by the year that contains
 * the largest share of their trips.
 */
export function suggestTripFilter(trips: Trip[]): FilterSuggestion<'trips'> | null {
  if (trips.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => t.endDate >= today);
  if (upcoming.length > 0) {
    return {
      scope: 'trips',
      label: 'Show upcoming trips only',
      apply: { status: 'upcoming' },
    };
  }

  const byYear = new Map<string, number>();
  for (const t of trips) {
    const y = t.startDate.slice(0, 4);
    if (y.length === 4) byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  let topYear: string | null = null;
  let topCount = 0;
  for (const [y, count] of byYear) {
    if (count > topCount) {
      topCount = count;
      topYear = y;
    }
  }
  if (!topYear || topCount / trips.length < 0.5) return null;

  return {
    scope: 'trips',
    label: `${topYear} trips only`,
    apply: { year: topYear },
  };
}

/**
 * Goals: if anything is still in-progress, nudge the user toward it so
 * the "what should I do next" framing is one tap away.
 */
export function suggestTargetFilter(
  targets: Target[],
  activities: Activity[],
): FilterSuggestion<'goals'> | null {
  if (targets.length === 0) return null;

  const inProgress = targets.filter((t) => {
    const current = computeTargetCurrentValue(t, activities);
    return current < t.targetValue;
  });
  if (inProgress.length === 0) return null;

  return {
    scope: 'goals',
    label: 'Show in-progress goals',
    apply: { status: 'in-progress' },
  };
}
