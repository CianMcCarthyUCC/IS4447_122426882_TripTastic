import { useMemo } from 'react';
import { useCategoryContext } from '@/context';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';
import { getWeekKey, getMonthKey } from '@/utils';
import { Palette } from '@/constants';
import type { Activity, ViewMode } from '@/types';

/** One segment of a stacked bar, e.g. completed minutes vs planned. */
export type BarStack = {
  value: number;
  color: string;
};

export type BarDataItem = {
  /**
   * Two-segment stack: logged minutes first (coral), then planned on
   * top (grey). Matches the "Logged / Planned" legend shown above
   * the chart.
   */
  stacks: BarStack[];
  label: string;
};

export type PieDataItem = {
  value: number;
  color: string;
  text: string;
  name: string;
  /** Ionicons name for the category - drives the legend icon. */
  icon: string;
};

const PIE_OTHER_THRESHOLD = 0.03;

const DAILY_WINDOW = 7;
const WEEKLY_WINDOW = 4;
const MONTHLY_WINDOW = 4;

// Colours used by the stacked bars. The logged (completed) block gets
// the app accent so real activity pops; planned blocks sit on top in
// neutral grey so they read as "not yet done" without competing visually.
export const BAR_LOGGED_COLOR = Palette.coral;
export const BAR_PLANNED_COLOR = Palette.grey500;
// Faded versions used when one bar is selected and the rest dim.
const BAR_LOGGED_FADED = Palette.coralFaded;
const BAR_PLANNED_FADED = 'rgba(100, 116, 139, 0.25)';

/**
 * The data cruncher behind the Insights screen. Produces a fixed-size
 * window of stacked bars (logged + planned minutes per slot) plus a
 * category donut. The window is anchored on the user's most recent
 * activity (or today if there is none), so the default chart always
 * lands on real data rather than an empty week ahead of the next trip.
 */
export function useInsightsData(
  viewMode: ViewMode,
  activities: Activity[],
  /**
   * Window offset. `0` = the window containing the anchor, `-1` = one
   * window earlier, and so on. The screen caps forward navigation at 0.
   */
  windowOffset: number = 0,
) {
  const { categories } = useCategoryContext();
  const categoryMap = useCategoryLookup(categories);

  const anchor = useMemo(() => anchorDateFor(activities), [activities]);

  const slots = useMemo(
    () => buildSlots(viewMode, windowOffset, anchor),
    [viewMode, windowOffset, anchor],
  );

  const rangeLabel = useMemo(() => buildRangeLabel(viewMode, slots), [viewMode, slots]);

  // Stacked bar: per slot, split minutes into "logged" (completed) and
  // "planned" so a day with both kinds of activity gets a two-colour
  // bar rather than one combined total.
  const barChartData = useMemo<BarDataItem[]>(() => {
    const logged = new Map<string, number>();
    const planned = new Map<string, number>();
    for (const a of activities) {
      const key = keyFor(viewMode, a.date);
      const target = a.status === 'completed' ? logged : planned;
      target.set(key, (target.get(key) ?? 0) + a.metric);
    }
    return slots.map((s) => ({
      label: s.label,
      stacks: [
        { value: logged.get(s.key) ?? 0, color: BAR_LOGGED_COLOR },
        { value: planned.get(s.key) ?? 0, color: BAR_PLANNED_COLOR },
      ],
    }));
  }, [activities, slots, viewMode]);

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
          icon: cat?.icon ?? 'ellipse',
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
        main.push({
          value: e.value,
          color: e.color,
          name: e.name,
          text: `${e.name} ${pct}%`,
          icon: e.icon,
        });
      }
    }
    if (otherTotal > 0) {
      const pct = Math.round((otherTotal / total) * 100);
      main.push({
        value: otherTotal,
        color: Palette.grey400,
        name: 'Other',
        text: `Other ${pct}%`,
        icon: 'ellipsis-horizontal',
      });
    }
    return main;
  }, [activities, categoryMap]);

  return {
    barChartData,
    categoryPieData,
    rangeLabel,
    canGoBack: true,
    canGoForward: windowOffset < 0,
  };
}

/** Faded variants of the two series, used by the chart on tap-to-focus. */
export const BAR_FADED_COLORS = {
  logged: BAR_LOGGED_FADED,
  planned: BAR_PLANNED_FADED,
} as const;

// ---- anchor ----

function anchorDateFor(activities: Activity[]): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (activities.length === 0) return today;
  let latest = today;
  for (const a of activities) {
    const d = new Date(a.date + 'T00:00:00');
    if (d > latest) latest = d;
  }
  return latest;
}

// ---- slots ----

type Slot = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

function buildSlots(viewMode: ViewMode, windowOffset: number, anchor: Date): Slot[] {
  switch (viewMode) {
    case 'daily':
      return buildDailySlots(windowOffset, anchor);
    case 'weekly':
      return buildWeeklySlots(windowOffset, anchor);
    case 'monthly':
      return buildMonthlySlots(windowOffset, anchor);
  }
}

function buildDailySlots(windowOffset: number, anchor: Date): Slot[] {
  const monday = mondayOfWeekContaining(anchor);
  monday.setDate(monday.getDate() + windowOffset * DAILY_WINDOW);
  const slots: Slot[] = [];
  for (let i = 0; i < DAILY_WINDOW; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    slots.push({
      key: toIso(d),
      label: d.toLocaleString('en', { weekday: 'short' }),
      start: d,
      end: d,
    });
  }
  return slots;
}

function buildWeeklySlots(windowOffset: number, anchor: Date): Slot[] {
  const endMonday = mondayOfWeekContaining(anchor);
  endMonday.setDate(endMonday.getDate() + windowOffset * WEEKLY_WINDOW * 7);
  const slots: Slot[] = [];
  for (let i = WEEKLY_WINDOW - 1; i >= 0; i--) {
    const start = new Date(endMonday);
    start.setDate(endMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    slots.push({
      key: getWeekKey(toIso(start)),
      label: start.toLocaleString('en', { month: 'short', day: 'numeric' }),
      start,
      end,
    });
  }
  return slots;
}

function buildMonthlySlots(windowOffset: number, anchor: Date): Slot[] {
  const endMonth = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + windowOffset * MONTHLY_WINDOW,
    1,
  );
  const slots: Slot[] = [];
  for (let i = MONTHLY_WINDOW - 1; i >= 0; i--) {
    const start = new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const month = start.toLocaleString('en', { month: 'short' });
    const yy = String(start.getFullYear()).slice(-2);
    slots.push({
      key: getMonthKey(toIso(start)),
      label: `${month} '${yy}`,
      start,
      end,
    });
  }
  return slots;
}

function keyFor(viewMode: ViewMode, dateString: string): string {
  switch (viewMode) {
    case 'daily':
      return dateString;
    case 'weekly':
      return getWeekKey(dateString);
    case 'monthly':
      return getMonthKey(dateString);
  }
}

// ---- range labels ----

function buildRangeLabel(viewMode: ViewMode, slots: Slot[]): string {
  if (slots.length === 0) return '';
  const first = slots[0];
  const last = slots[slots.length - 1];
  if (viewMode === 'monthly') {
    const startMonth = first.start.toLocaleString('en', { month: 'short' });
    const endMonth = last.start.toLocaleString('en', { month: 'short' });
    const yy = String(last.start.getFullYear()).slice(-2);
    if (first.start.getFullYear() === last.start.getFullYear()) {
      return `${startMonth} - ${endMonth} '${yy}`;
    }
    const startYy = String(first.start.getFullYear()).slice(-2);
    return `${startMonth} '${startYy} - ${endMonth} '${yy}`;
  }
  return `${formatShortDate(first.start)} - ${formatShortDate(last.end)}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleString('en', { month: 'short', day: 'numeric' });
}

// ---- date helpers ----

function mondayOfWeekContaining(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
}

function toIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
