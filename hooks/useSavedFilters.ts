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
 * The hook that looks after the user's saved filter presets. Loads them
 * on start-up and exposes the save, delete and apply actions, so the
 * user's favourite filters are always one tap away.
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
