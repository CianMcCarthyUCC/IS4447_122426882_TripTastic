import { useCallback, useEffect, useState } from 'react';
import { getAllSavedFilters, insertSavedFilter, deleteSavedFilterById } from '@/db';

export type SavedFilter = {
  id: number;
  name: string;
  filterType: string;
  filterValue: string;
  createdAt: string;
};

/**
 * Hook for managing saved filters (SQLite-persisted).
 * Loads on mount, provides save/delete/apply operations.
 */
export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const refresh = useCallback(async () => {
    const rows = await getAllSavedFilters();
    setSavedFilters(rows);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveFilter = useCallback(
    async (name: string, filterType: string, filterValue: string) => {
      await insertSavedFilter(name, filterType, filterValue);
      await refresh();
    },
    [refresh],
  );

  const removeFilter = useCallback(
    async (id: number) => {
      await deleteSavedFilterById(id);
      await refresh();
    },
    [refresh],
  );

  return { savedFilters, saveFilter, removeFilter, refresh };
}
