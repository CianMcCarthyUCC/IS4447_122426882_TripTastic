import { useMemo } from 'react';
import { useActivityContext } from '@/context';
import { useTargetContext } from '@/context';
import { useCategoryContext } from '@/context';
import {
  getDayLabel,
  getWeekKey,
  getMonthKey,
  groupByPeriod,
  sortGroupedEntries,
} from '@/utils';
import type { ViewMode } from '@/types';

export type BarDataItem = {
  value: number;
  label: string;
  frontColor: string;
};

export type LineDataItem = {
  value: number;
  label: string;
};

export type ProgressItem = {
  targetId: number;
  categoryName: string;
  categoryColor: string;
  current: number;
  target: number;
  period: string;
  percent: number;
  exceeded: boolean;
};

/**
 * Aggregation hook for the Insights screen.
 * Returns chart-ready data based on the selected view mode.
 */
export function useInsightsData(viewMode: ViewMode) {
  const { activities } = useActivityContext();
  const { targets } = useTargetContext();
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
      frontColor: '#0F766E',
    }));
  }, [activities, getKey, keyToLabel]);

  // Line chart: cumulative trend over time
  const lineChartData = useMemo<LineDataItem[]>(() => {
    const grouped = groupByPeriod(activities, getKey);
    const sorted = sortGroupedEntries(grouped);

    let cumulative = 0;
    return sorted.map((entry) => {
      cumulative += entry.value;
      return {
        value: cumulative,
        label: keyToLabel(entry.key),
      };
    });
  }, [activities, getKey, keyToLabel]);

  // Per-category bar data (colored by category)
  const categoryBarData = useMemo<BarDataItem[]>(() => {
    // Group by category, showing total across all time
    const catTotals = new Map<number, number>();
    for (const a of activities) {
      catTotals.set(a.categoryId, (catTotals.get(a.categoryId) ?? 0) + a.metric);
    }

    return Array.from(catTotals.entries())
      .map(([catId, total]) => {
        const cat = categoryMap.get(catId);
        return {
          value: total,
          label: cat?.name?.slice(0, 6) ?? '?',
          frontColor: cat?.color ?? '#94A3B8',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [activities, categoryMap]);

  // Target progress
  const progressData = useMemo<ProgressItem[]>(() => {
    return targets.map((t) => {
      const current = activities
        .filter((a) => {
          if (a.categoryId !== t.categoryId) return false;
          if (t.tripId !== null && a.tripId !== t.tripId) return false;
          return true;
        })
        .reduce((sum, a) => sum + a.metric, 0);

      const cat = categoryMap.get(t.categoryId);
      const percent = t.targetValue > 0 ? Math.round((current / t.targetValue) * 100) : 0;

      return {
        targetId: t.id,
        categoryName: cat?.name ?? 'Unknown',
        categoryColor: cat?.color ?? '#94A3B8',
        current,
        target: t.targetValue,
        period: t.period,
        percent,
        exceeded: current > t.targetValue,
      };
    });
  }, [activities, targets, categoryMap]);

  return {
    barChartData,
    lineChartData,
    categoryBarData,
    progressData,
  };
}
