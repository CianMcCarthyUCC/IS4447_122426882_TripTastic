import { useCallback, useMemo, useState } from 'react';
import type { Place } from '@/utils/geoapify';

export type PlaceSortDirection = 'asc' | 'desc';

type FilterState = {
  searchQuery: string;
  selectedCategory: string;
  sortDirection: PlaceSortDirection;
};

type FilterActions = {
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (id: string) => void;
  setSortDirection: (d: PlaceSortDirection) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  activeFilterCount: number;
};

/**
 * The filter and sort hook for the Places list. Matches the shape of
 * the activities filter hook so both screens can share the same search
 * bar and chip setup.
 */
export function useFilteredPlaces(places: Place[]): { filtered: Place[] } & FilterState & FilterActions {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortDirection, setSortDirection] = useState<PlaceSortDirection>('asc');

  const filtered = useMemo(() => {
    let result = places;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === Number(selectedCategory));
    }

    const sorted = [...result].sort((a, b) =>
      sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

    return sorted;
  }, [places, searchQuery, selectedCategory, sortDirection]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortDirection('asc');
  }, []);

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);

  return {
    filtered,
    searchQuery,
    selectedCategory,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setSortDirection,
    resetFilters,
    isFiltered: activeFilterCount > 0,
    activeFilterCount,
  };
}
