import { renderHook } from '@testing-library/react-native';
import type { Activity, Category, Target } from '@/types';

// Mutable containers so each test can swap the data returned by the
// mocked context hooks without re-mocking. jest.mock hoists above the
// import, but these refs are populated imperatively per-test below.
const state: {
  activities: Activity[];
  targets: Target[];
  categories: Category[];
} = { activities: [], targets: [], categories: [] };

jest.mock('@/context', () => ({
  useActivityContext: () => ({ activities: state.activities }),
  useTargetContext: () => ({ targets: state.targets }),
  useCategoryContext: () => ({ categories: state.categories }),
}));

// Silence Expo SQLite side-effects - the hook doesn't touch the DB but
// `@/utils` transitively pulls in modules that do in some projects. The
// mock is cheap insurance.
jest.mock('@/db/client', () => ({ db: {} }));

import { useInsightsData } from '@/hooks/useInsightsData';

const cat = (id: number, name: string, color = '#000000'): Category => ({
  id,
  name,
  color,
  icon: 'star',
  isSystem: false,
});

const activity = (
  id: number,
  categoryId: number,
  date: string,
  metric: number,
  status: 'planned' | 'completed' = 'completed',
): Activity => ({
  id,
  tripId: 1,
  categoryId,
  date,
  metric,
  status,
  place: null,
  notes: null,
  isFavourite: false, favouritedAt: null,
});

beforeEach(() => {
  state.activities = [];
  state.targets = [];
  state.categories = [];
});

describe('useInsightsData - barChartData window shape', () => {
  it('produces a fixed 7-day window for daily view', () => {
    const { result } = renderHook(() => useInsightsData('daily', state.activities));
    expect(result.current.barChartData).toHaveLength(7);
    // Every bar has two stack segments (logged + planned).
    expect(result.current.barChartData.every((b) => b.stacks.length === 2)).toBe(true);
    // Every segment starts at zero when there are no activities.
    expect(
      result.current.barChartData.every(
        (b) => b.stacks.reduce((s, seg) => s + seg.value, 0) === 0,
      ),
    ).toBe(true);
  });

  it('produces a fixed 4-slot window for weekly view', () => {
    const { result } = renderHook(() => useInsightsData('weekly', state.activities));
    expect(result.current.barChartData).toHaveLength(4);
  });

  it('produces a fixed 4-slot window for monthly view', () => {
    const { result } = renderHook(() => useInsightsData('monthly', state.activities));
    expect(result.current.barChartData).toHaveLength(4);
  });

  it('emits a range label describing the window', () => {
    const { result } = renderHook(() => useInsightsData('weekly', state.activities));
    expect(result.current.rangeLabel).toMatch(/-/);
  });

  it('exposes forward/back flags that match the offset', () => {
    const atMostRecent = renderHook(() => useInsightsData('weekly', state.activities, 0));
    expect(atMostRecent.result.current.canGoBack).toBe(true);
    expect(atMostRecent.result.current.canGoForward).toBe(false);

    const stepBack = renderHook(() => useInsightsData('weekly', state.activities, -1));
    expect(stepBack.result.current.canGoForward).toBe(true);
  });
});

describe('useInsightsData - categoryPieData', () => {
  it('buckets sub-3% slices into a single "Other" segment', () => {
    state.categories = [
      cat(1, 'Food', '#FF0000'),
      cat(2, 'Sightseeing', '#00FF00'),
      cat(3, 'Transport', '#0000FF'),
      cat(4, 'Shopping', '#FFFF00'),
    ];
    state.activities = [
      activity(1, 1, '2026-01-01', 285),
      activity(2, 2, '2026-01-01', 5),
      activity(3, 3, '2026-01-01', 5),
      activity(4, 4, '2026-01-01', 5),
    ];

    const { result } = renderHook(() => useInsightsData('monthly', state.activities));
    const names = result.current.categoryPieData.map((d) => d.name);
    expect(names).toContain('Food');
    expect(names).toContain('Other');
    expect(names).not.toContain('Transport');
    expect(names).not.toContain('Shopping');
    const other = result.current.categoryPieData.find((d) => d.name === 'Other');
    expect(other?.value).toBe(15);
  });

  it('returns [] when total metric is zero', () => {
    state.categories = [cat(1, 'Food')];
    const { result } = renderHook(() => useInsightsData('daily', state.activities));
    expect(result.current.categoryPieData).toEqual([]);
  });
});
