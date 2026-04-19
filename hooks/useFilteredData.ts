import { useMemo, useState, useCallback } from 'react';
import { dateRangeBounds } from '@/utils/dateRangeFilter';
import type { DateRange as FullDateRange } from '@/utils/dateRangeFilter';
import type { Activity, Category, Target } from '@/types';

// The list filter surfaces (ActivitiesSection, Trips, Targets) don't
// offer a "custom" window, so this hook exposes a narrower subset of the
// canonical DateRange union. Predicate semantics still come from the
// shared utility so "week"/"month" match everywhere in the app.
export type DateRange = Exclude<FullDateRange, 'custom'>;

type FilterState = {
  searchQuery: string;
  selectedCategory: string;
  dateRange: DateRange;
};

type FilterActions = {
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (id: string) => void;
  setDateRange: (range: DateRange) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  activeFilterCount: number;
};

/**
 * Reusable filter hook — text search, category filter, date range filter.
 * Composes AND logic across all filters. Used on every list tab.
 */
export function useFilteredActivities(
  activities: Activity[],
  categories: Category[],
): { filtered: Activity[] } & FilterState & FilterActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name.toLowerCase()])),
    [categories],
  );

  const filtered = useMemo(() => {
    let result = activities;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
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

    return result;
  }, [activities, categories, searchQuery, selectedCategory, dateRange]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateRange('all');
  }, []);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0);

  return {
    filtered,
    searchQuery,
    selectedCategory,
    dateRange,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
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
