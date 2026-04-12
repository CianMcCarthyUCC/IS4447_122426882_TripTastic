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
