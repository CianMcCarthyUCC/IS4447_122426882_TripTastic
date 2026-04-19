import { useMemo } from 'react';
import { useCategoryContext } from '@/context';
import {
  getDayLabel,
  getWeekKey,
  getMonthKey,
  groupByPeriod,
  sortGroupedEntries,
} from '@/utils';
import { Palette } from '@/constants';
import type { Activity, ViewMode } from '@/types';

export type BarDataItem = {
  value: number;
  label: string;
  frontColor: string;
};

export type LineDataItem = {
  value: number;
  label: string;
};

export type PieDataItem = {
  value: number;
  color: string;
  /** Short on-slice label (e.g. percentage). */
  text: string;
  /** Full category name for the legend. */
  name: string;
};

// Slices under this fraction of the total get bucketed into "Other" so
// the donut legend stays readable. 3% chosen empirically — at 4 or 5
// categories most slices clear it, at 10+ the tail collapses cleanly.
const PIE_OTHER_THRESHOLD = 0.03;

/**
 * Aggregation hook for the Insights screen. Returns chart-ready data
 * based on the selected view mode + the activity list passed in.
 *
 * Activities are injected as a parameter (not read from context) so the
 * Insights screen can feed in a *filtered* set without this hook
 * needing to know about the filter pipeline. Keeps the hook pure and
 * unit-testable.
 */
export function useInsightsData(viewMode: ViewMode, activities: Activity[]) {
  const { categories } = useCategoryContext();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Determine grouping key function based on view mode
  const getKey = useMemo(() => {
    switch (viewMode) {
      case 'daily':
        return (d: string) => d;
      case 'weekly':
        return getWeekKey;
      case 'monthly':
        return getMonthKey;
    }
  }, [viewMode]);

  /**
   * Converts a grouped key back to a display label.
   * Daily keys are dates ("2026-07-02") → "Jul 2"
   * Weekly keys ("2026-W27") → "W27"
   * Monthly keys ("2026-07") → "Jul"
   */
  const keyToLabel = useMemo(() => {
    switch (viewMode) {
      case 'daily':
        return getDayLabel;
      case 'weekly':
        return (key: string) => key.replace(/^\d{4}-/, '');
      case 'monthly':
        return (key: string) => {
          const date = new Date(key + '-01T00:00:00');
          return date.toLocaleString('en', { month: 'short' });
        };
    }
  }, [viewMode]);

  // Bar chart: total activity minutes per period
  const barChartData = useMemo<BarDataItem[]>(() => {
    const grouped = groupByPeriod(activities, getKey);
    const sorted = sortGroupedEntries(grouped);

    return sorted.map((entry) => ({
      value: entry.value,
      label: keyToLabel(entry.key),
      // Bar fill stays navy — deep cool blue against cream card reads
      // as the data series anchor without competing with coral (CTA).
      frontColor: Palette.navy,
    }));
  }, [activities, getKey, keyToLabel]);

  // Dual-line: planned vs completed activity counts per period.
  //
  // Label arrays **must** align across both series so gifted-charts can
  // overlay them via `data` + `data2`. Missing periods on either side
  // are zero-filled rather than skipped — a dropped index would make
  // the tooltip pair the wrong labels.
  const { plannedLine, completedLine } = useMemo<{
    plannedLine: LineDataItem[];
    completedLine: LineDataItem[];
  }>(() => {
    const planned = new Map<string, number>();
    const completed = new Map<string, number>();
    for (const a of activities) {
      const key = getKey(a.date);
      if (a.status === 'completed') {
        completed.set(key, (completed.get(key) ?? 0) + 1);
      } else {
        planned.set(key, (planned.get(key) ?? 0) + 1);
      }
    }
    // Union of keys — zero-fill the side that doesn't have an entry.
    const allKeys = Array.from(new Set([...planned.keys(), ...completed.keys()])).sort();
    return {
      plannedLine: allKeys.map((k) => ({ value: planned.get(k) ?? 0, label: keyToLabel(k) })),
      completedLine: allKeys.map((k) => ({ value: completed.get(k) ?? 0, label: keyToLabel(k) })),
    };
  }, [activities, getKey, keyToLabel]);

  // Donut: share of total minutes per category, across the filtered set.
  // Tail slices (<3%) collapse into a single "Other" segment so the
  // legend isn't drowned by single-activity categories.
  const categoryPieData = useMemo<PieDataItem[]>(() => {
    const catTotals = new Map<number, number>();
    for (const a of activities) {
      catTotals.set(a.categoryId, (catTotals.get(a.categoryId) ?? 0) + a.metric);
    }

    const total = Array.from(catTotals.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    const entries = Array.from(catTotals.entries())
      .map(([catId, value]) => {
        const cat = categoryMap.get(catId);
        return {
          value,
          color: cat?.color ?? Palette.grey400,
          name: cat?.name ?? 'Unknown',
        };
      })
      .sort((a, b) => b.value - a.value);

    const main: PieDataItem[] = [];
    let otherTotal = 0;
    for (const e of entries) {
      if (e.value / total < PIE_OTHER_THRESHOLD) {
        otherTotal += e.value;
      } else {
        const pct = Math.round((e.value / total) * 100);
        main.push({ value: e.value, color: e.color, name: e.name, text: `${pct}%` });
      }
    }
    if (otherTotal > 0) {
      const pct = Math.round((otherTotal / total) * 100);
      main.push({ value: otherTotal, color: Palette.grey400, name: 'Other', text: `${pct}%` });
    }
    return main;
  }, [activities, categoryMap]);

  return {
    barChartData,
    plannedLine,
    completedLine,
    categoryPieData,
  };
}
