import { useMemo, useState, useCallback } from 'react';
import type { Activity, Category, Target } from '@/types';

export type DateRange = 'all' | 'today' | 'week' | 'month';

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
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (dateRange === 'today') {
        result = result.filter((a) => a.date === today);
      } else if (dateRange === 'week') {
        const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        result = result.filter((a) => a.date >= cutoff);
      } else if (dateRange === 'month') {
        const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        result = result.filter((a) => a.date >= cutoff);
      }
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
