// Shared date-range filter primitives. Both the list-tab filter hook
// (`useFilteredData`) and the insights filter hook (`useInsightsFilters`)
// derive their "today / week / month / custom" windows from here so the
// semantics stay identical across every filter surface in the app.
//
// All activity dates in the DB are stored as plain YYYY-MM-DD strings, so
// these helpers intentionally avoid parsing dates - we compare strings
// lexicographically, which is correct for ISO-8601 date-only values and
// keeps the filter predicate allocation-free on large lists.

export type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';

/** Start of today as a YYYY-MM-DD string. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** N-days-ago as a YYYY-MM-DD string. Inclusive of today when `days=0`. */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

/**
 * Convert a range (+ optional custom bounds) into a pair of string
 * comparison bounds. A `null` bound means unbounded on that side.
 *
 *   week   → last 7 days inclusive of today (floor = 6 days ago)
 *   month  → last 30 days inclusive of today (floor = 29 days ago)
 *   custom → whichever of start/end the caller supplied; auto-swaps
 *            if the user picked end-before-start.
 */
export function dateRangeBounds(
  range: DateRange,
  customStart: string | null = null,
  customEnd: string | null = null,
): { floor: string | null; ceil: string | null } {
  if (range === 'today') return { floor: todayIso(), ceil: null };
  if (range === 'week') return { floor: daysAgoIso(6), ceil: null };
  if (range === 'month') return { floor: daysAgoIso(29), ceil: null };
  if (range === 'custom') {
    if (customStart && customEnd) {
      return customStart <= customEnd
        ? { floor: customStart, ceil: customEnd }
        : { floor: customEnd, ceil: customStart };
    }
    if (customStart) return { floor: customStart, ceil: null };
    if (customEnd) return { floor: null, ceil: customEnd };
  }
  return { floor: null, ceil: null };
}

/**
 * True if a YYYY-MM-DD date falls within the given range. Cheap enough
 * to call per-activity, but when filtering a large list prefer the
 * `dateRangeBounds` + manual comparison pattern so the bounds are only
 * computed once.
 */
export function matchesDateRange(
  dateIso: string,
  range: DateRange,
  customStart: string | null = null,
  customEnd: string | null = null,
): boolean {
  const { floor, ceil } = dateRangeBounds(range, customStart, customEnd);
  if (floor && dateIso < floor) return false;
  if (ceil && dateIso > ceil) return false;
  return true;
}
