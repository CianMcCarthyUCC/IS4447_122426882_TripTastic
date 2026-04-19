import { act, renderHook } from '@testing-library/react-native';
import type { Activity, Category, Trip } from '@/types';

// Mutable containers so each test can swap context data without re-mocking.
const state: {
  activities: Activity[];
  categories: Category[];
  trips: Trip[];
} = { activities: [], categories: [], trips: [] };

jest.mock('@/context', () => ({
  useActivityContext: () => ({ activities: state.activities }),
  useCategoryContext: () => ({ categories: state.categories }),
  useTripContext: () => ({ trips: state.trips }),
}));

jest.mock('@/db/client', () => ({ db: {} }));

import { useInsightsFilters } from '@/hooks/useInsightsFilters';

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
  notes: string | null = null,
  tripId: number = 1,
): Activity => ({
  id,
  tripId,
  categoryId,
  date,
  metric,
  status,
  notes,
  isFavourite: false,
});

const trip = (id: number, name: string, country: string): Trip => ({
  id,
  name,
  destination: name,
  country,
  coverImage: null,
  startDate: '2026-01-01',
  endDate: '2026-01-07',
});

// YYYY-MM-DD offset from today; mirrors how the hook computes dateFloor.
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

beforeEach(() => {
  state.activities = [];
  state.categories = [];
  state.trips = [];
});

describe('useInsightsFilters', () => {
  it('matches search against notes OR category name (debounced)', () => {
    jest.useFakeTimers();

    state.categories = [cat(1, 'Food'), cat(2, 'Sightseeing')];
    state.activities = [
      // Match by category name
      activity(1, 1, '2026-01-01', 30, 'completed', 'lunch downtown'),
      // Match by notes ("food truck") even though category is Sightseeing
      activity(2, 2, '2026-01-02', 45, 'completed', 'food truck stop'),
      // No match either field
      activity(3, 2, '2026-01-03', 20, 'completed', 'museum visit'),
    ];

    const { result } = renderHook(() => useInsightsFilters());
    expect(result.current.filteredActivities).toHaveLength(3);

    act(() => {
      result.current.setSearchQuery('food');
    });
    // Flush the 300ms debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    const ids = result.current.filteredActivities.map((a) => a.id).sort();
    expect(ids).toEqual([1, 2]);
    expect(result.current.isFiltered).toBe(true);

    jest.useRealTimers();
  });

  it('intersects category + status filters (AND, not OR)', () => {
    state.categories = [cat(1, 'Food'), cat(2, 'Sightseeing')];
    state.activities = [
      activity(1, 1, '2026-01-01', 30, 'planned'),
      activity(2, 1, '2026-01-02', 30, 'completed'), // survivor
      activity(3, 2, '2026-01-03', 30, 'planned'),
      activity(4, 2, '2026-01-04', 30, 'completed'),
    ];

    const { result } = renderHook(() => useInsightsFilters());

    act(() => {
      result.current.setSelectedCategoryId(1);
      result.current.setStatus('completed');
    });

    expect(result.current.filteredActivities).toHaveLength(1);
    expect(result.current.filteredActivities[0].id).toBe(2);
    expect(result.current.activeFilterCount).toBe(2);
  });

  it('filters by country via the activity\u2019s trip', () => {
    state.categories = [cat(1, 'Food')];
    state.trips = [trip(1, 'Rome', 'Italy'), trip(2, 'Paris', 'France')];
    state.activities = [
      activity(1, 1, '2026-01-01', 30, 'completed', null, 1), // Italy
      activity(2, 1, '2026-01-02', 30, 'completed', null, 2), // France
    ];

    const { result } = renderHook(() => useInsightsFilters());
    expect(result.current.availableCountries).toEqual(['France', 'Italy']);

    act(() => {
      result.current.setCountry('Italy');
    });

    expect(result.current.filteredActivities.map((a) => a.id)).toEqual([1]);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('filters by continent by resolving trip.country\u2192continent', () => {
    state.categories = [cat(1, 'Food')];
    state.trips = [
      trip(1, 'Rome', 'Italy'), // Europe
      trip(2, 'Paris', 'France'), // Europe
      trip(3, 'Tokyo', 'Japan'), // Asia
    ];
    state.activities = [
      activity(1, 1, '2026-01-01', 30, 'completed', null, 1),
      activity(2, 1, '2026-01-02', 30, 'completed', null, 2),
      activity(3, 1, '2026-01-03', 30, 'completed', null, 3),
    ];

    const { result } = renderHook(() => useInsightsFilters());
    expect(result.current.availableContinents.sort()).toEqual(['Asia', 'Europe']);

    act(() => {
      result.current.setContinent('Europe');
    });

    expect(result.current.filteredActivities.map((a) => a.id).sort()).toEqual([1, 2]);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('filters out activities outside the selected date range', () => {
    state.categories = [cat(1, 'Food')];
    state.activities = [
      activity(1, 1, isoDaysAgo(0), 30), // today
      activity(2, 1, isoDaysAgo(10), 20), // outside a 7-day window
    ];

    const { result } = renderHook(() => useInsightsFilters());
    expect(result.current.filteredActivities).toHaveLength(2);

    act(() => {
      result.current.setDateRange('week');
    });

    expect(result.current.filteredActivities).toHaveLength(1);
    expect(result.current.filteredActivities[0].id).toBe(1);
    expect(result.current.activeFilterCount).toBe(1);
  });
});
