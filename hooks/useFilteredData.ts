import { useMemo, useState, useCallback } from 'react';
import { dateRangeBounds } from '@/utils/dateRangeFilter';
import type { DateRange as FullDateRange } from '@/utils/dateRangeFilter';
import type { Activity, ActivityStatus, Category, Target } from '@/types';

// List filters (ActivitiesSection, Trips, Targets) share the same
// DateRange union as insights so "custom" start/end bounds work anywhere
// a date filter is surfaced.
export type DateRange = FullDateRange;

export type StatusFilter = 'all' | ActivityStatus;
export type SortDirection = 'asc' | 'desc';

type FilterState = {
  searchQuery: string;
  selectedCategory: string;
  dateRange: DateRange;
  customStart: string | null;
  customEnd: string | null;
  status: StatusFilter;
  favouritesOnly: boolean;
  sortDirection: SortDirection;
};

type FilterActions = {
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (id: string) => void;
  setDateRange: (range: DateRange) => void;
  setCustomDateRange: (start: string | null, end: string | null) => void;
  setStatus: (status: StatusFilter) => void;
  setFavouritesOnly: (v: boolean) => void;
  setSortDirection: (d: SortDirection) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  activeFilterCount: number;
};

/**
 * The shared filter hook used on every list screen. Handles text search,
 * category filter and date range in one consistent way so every list
 * behaves the same.
 */
export function useFilteredActivities(
  activities: Activity[],
  categories: Category[],
): { filtered: Activity[] } & FilterState & FilterActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');

  const setCustomDateRange = useCallback((start: string | null, end: string | null) => {
    setCustomStart(start);
    setCustomEnd(end);
  }, []);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name.toLowerCase()])),
    [categories],
  );

  const filtered = useMemo(() => {
    let result = activities;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.place?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.date.includes(q) ||
        categoryMap.get(a.categoryId)?.includes(q),
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.categoryId === Number(selectedCategory));
    }

    if (dateRange !== 'all') {
      const { floor, ceil } = dateRangeBounds(dateRange, customStart, customEnd);
      result = result.filter((a) => {
        if (floor && a.date < floor) return false;
        if (ceil && a.date > ceil) return false;
        return true;
      });
    }

    if (status !== 'all') {
      result = result.filter((a) => a.status === status);
    }

    if (favouritesOnly) {
      result = result.filter((a) => a.isFavourite);
    }

    const sorted = [...result].sort((a, b) =>
      sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
    );

    return sorted;
  }, [activities, categoryMap, searchQuery, selectedCategory, dateRange, customStart, customEnd, status, favouritesOnly, sortDirection]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateRange('all');
    setCustomStart(null);
    setCustomEnd(null);
    setStatus('all');
    setFavouritesOnly(false);
    setSortDirection('asc');
  }, []);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (favouritesOnly ? 1 : 0);

  return {
    filtered,
    searchQuery,
    selectedCategory,
    dateRange,
    customStart,
    customEnd,
    status,
    favouritesOnly,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
    setCustomDateRange,
    setStatus,
    setFavouritesOnly,
    setSortDirection,
    resetFilters,
    isFiltered: activeFilterCount > 0,
    activeFilterCount,
  };
}

/**
 * Reusable text filter for simple lists (categories, targets).
 */
export function useTextFilter<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => searchFn(item, q));
  }, [items, searchQuery, searchFn]);

  return { filtered, searchQuery, setSearchQuery, isFiltered: !!searchQuery };
}
