import { useMemo, useState, useCallback } from 'react';
import { dateRangeBounds } from '@/utils/dateRangeFilter';
import type { DateRange as FullDateRange } from '@/utils/dateRangeFilter';
import type { Activity, ActivityStatus, Category, Target } from '@/types';

// The list filter surfaces (ActivitiesSection, Trips, Targets) don't
// offer a "custom" window, so this hook exposes a narrower subset of the
// canonical DateRange union. Predicate semantics still come from the
// shared utility so "week"/"month" match everywhere in the app.
export type DateRange = Exclude<FullDateRange, 'custom'>;

export type StatusFilter = 'all' | ActivityStatus;
export type SortDirection = 'asc' | 'desc';

type FilterState = {
  searchQuery: string;
  selectedCategory: string;
  dateRange: DateRange;
  status: StatusFilter;
  favouritesOnly: boolean;
  sortDirection: SortDirection;
};

type FilterActions = {
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (id: string) => void;
  setDateRange: (range: DateRange) => void;
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
  const [status, setStatus] = useState<StatusFilter>('all');
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
      const { floor, ceil } = dateRangeBounds(dateRange);
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
  }, [activities, categoryMap, searchQuery, selectedCategory, dateRange, status, favouritesOnly, sortDirection]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateRange('all');
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
    status,
    favouritesOnly,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
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
