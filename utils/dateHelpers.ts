/**
 * Pure date utility functions for grouping activities by period.
 * No React dependencies — can be tested independently.
 */

/**
 * Returns the ISO week number for a given date string (YYYY-MM-DD).
 */
export function getWeekNumber(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  );
}

/**
 * Returns a short week label, e.g. "W27".
 */
export function getWeekLabel(dateString: string): string {
  return `W${getWeekNumber(dateString)}`;
}

/**
 * Returns a short month label, e.g. "Jul".
 */
export function getMonthLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleString('en', { month: 'short' });
}

/**
 * Returns a short day label, e.g. "Jul 2".
 */
export function getDayLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleString('en', { month: 'short', day: 'numeric' });
}

/**
 * Returns the year-month key for grouping, e.g. "2026-07".
 */
export function getMonthKey(dateString: string): string {
  return dateString.slice(0, 7);
}

/**
 * Returns the year-week key for grouping, e.g. "2026-W27".
 */
export function getWeekKey(dateString: string): string {
  const year = dateString.slice(0, 4);
  return `${year}-W${getWeekNumber(dateString).toString().padStart(2, '0')}`;
}

/**
 * Groups an array of items by a key derived from each item's date.
 * Returns a Map of groupKey -> sum of metric values.
 */
export function groupByPeriod<T extends { date: string; metric: number }>(
  items: T[],
  getKey: (dateString: string) => string,
): Map<string, number> {
  const groups = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item.date);
    groups.set(key, (groups.get(key) ?? 0) + item.metric);
  }
  return groups;
}

/**
 * Sorts grouped entries by their keys chronologically.
 */
export function sortGroupedEntries(
  groups: Map<string, number>,
): Array<{ key: string; value: number }> {
  return Array.from(groups.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Whole-day difference between two YYYY-MM-DD strings (b - a).
 */
function diffInDays(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00').getTime();
  const d2 = new Date(b + 'T00:00:00').getTime();
  return Math.round((d2 - d1) / 86400000);
}

/**
 * Returns a short relative status for a trip window, e.g. "in 75 days",
 * "Day 3 of 7", "Tomorrow", "Today", "Ended". Uses midnight-local today.
 */
export function getTripStatus(startDate: string, endDate: string, now: Date = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  const daysToStart = diffInDays(today, startDate);
  const daysToEnd = diffInDays(today, endDate);

  if (daysToStart > 1) return `in ${daysToStart} days`;
  if (daysToStart === 1) return 'Tomorrow';
  if (daysToStart === 0) return 'Today';
  // Trip has started (daysToStart < 0)
  if (daysToEnd >= 0) {
    const total = diffInDays(startDate, endDate) + 1;
    const current = Math.abs(daysToStart) + 1;
    return `Day ${current} of ${total}`;
  }
  return 'Ended';
}

/**
 * Number of nights between two YYYY-MM-DD strings (endDate - startDate).
 * A 1-day trip returns 0 nights.
 */
export function getNightsCount(startDate: string, endDate: string): number {
  return Math.max(0, diffInDays(startDate, endDate));
}

/**
 * Human-readable formatting of a single ISO string. Accepts either a
 * date-only slug (YYYY-MM-DD) or a full ISO timestamp — date-only inputs
 * are parsed at local midnight so they never display off-by-one in
 * timezones west of UTC.
 *
 *   'dayMonthYear' (default) → "18 Apr 2026" — used on filter chips, date fields
 *   'monthYear'              → "April 2026" — used for "member since" style labels
 */
export function formatIsoDate(
  iso: string,
  style: 'dayMonthYear' | 'monthYear' = 'dayMonthYear',
): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (style === 'monthYear') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Compact date range label. Same month → "Jul 1–14". Cross-month → "Jul 28 – Aug 3".
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const startMonth = s.toLocaleString('en', { month: 'short' });
  if (sameMonth) return `${startMonth} ${s.getDate()}–${e.getDate()}`;
  const endMonth = e.toLocaleString('en', { month: 'short' });
  return `${startMonth} ${s.getDate()} – ${endMonth} ${e.getDate()}`;
}
