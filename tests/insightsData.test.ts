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

// Silence Expo SQLite side-effects — the hook doesn't touch the DB but
// `@/utils` transitively pulls in modules that do in some projects. The
// mock is cheap insurance.
jest.mock('@/db/client', () => ({ db: {} }));

import { useInsightsData } from '@/hooks/useInsightsData';

const cat = (id: number, name: string, color = '#000000'): Category => ({
  id,
  name,
  color,
  icon: 'star',
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
  notes: null,
  isFavourite: false,
});

beforeEach(() => {
  state.activities = [];
  state.targets = [];
  state.categories = [];
});

describe('useInsightsData — plannedLine / completedLine', () => {
  it('zero-fills missing periods so the two series align by index', () => {
    // Day A has only a completed activity; Day B has only a planned one.
    // Both series must emit a value for both labels so gifted-charts can
    // overlay them point-for-point.
    state.categories = [cat(1, 'Food')];
    state.activities = [
      activity(1, 1, '2026-01-01', 30, 'completed'),
      activity(2, 1, '2026-01-02', 30, 'planned'),
    ];

    const { result } = renderHook(() => useInsightsData('daily', state.activities));
    expect(result.current.plannedLine).toHaveLength(2);
    expect(result.current.completedLine).toHaveLength(2);
    // Labels must match position-for-position.
    expect(result.current.plannedLine.map((p) => p.label)).toEqual(
      result.current.completedLine.map((p) => p.label),
    );
    // Day A: 0 planned, 1 completed. Day B: 1 planned, 0 completed.
    expect(result.current.plannedLine.map((p) => p.value)).toEqual([0, 1]);
    expect(result.current.completedLine.map((p) => p.value)).toEqual([1, 0]);
  });

  it('returns empty arrays when there are no activities', () => {
    const { result } = renderHook(() => useInsightsData('weekly', state.activities));
    expect(result.current.plannedLine).toEqual([]);
    expect(result.current.completedLine).toEqual([]);
  });
});

describe('useInsightsData — categoryPieData', () => {
  it('buckets sub-3% slices into a single "Other" segment', () => {
    state.categories = [
      cat(1, 'Food', '#FF0000'),
      cat(2, 'Sightseeing', '#00FF00'),
      cat(3, 'Transport', '#0000FF'),
      cat(4, 'Shopping', '#FFFF00'),
    ];
    // Food dominates (95%). The three tail categories each hold ~1.67%
    // of the total (5 / 300), well under the 3% threshold, so they
    // should collapse into one "Other" slice.
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
    // Other's value is the sum of the dropped slices.
    const other = result.current.categoryPieData.find((d) => d.name === 'Other');
    expect(other?.value).toBe(15);
  });

  it('returns [] when total metric is zero', () => {
    state.categories = [cat(1, 'Food')];
    const { result } = renderHook(() => useInsightsData('daily', state.activities));
    expect(result.current.categoryPieData).toEqual([]);
  });
});

describe('useInsightsData — barChartData', () => {
  it('aggregates metric per period under the selected view mode', () => {
    state.categories = [cat(1, 'Food')];
    state.activities = [
      activity(1, 1, '2026-01-01', 30),
      activity(2, 1, '2026-01-01', 15),
      activity(3, 1, '2026-02-01', 20),
    ];
    const { result } = renderHook(() => useInsightsData('monthly', state.activities));
    // Two distinct months → two bars; January sums to 45.
    expect(result.current.barChartData).toHaveLength(2);
    expect(result.current.barChartData[0].value).toBe(45);
    expect(result.current.barChartData[1].value).toBe(20);
  });
});
