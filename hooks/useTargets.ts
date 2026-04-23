import { useCallback } from 'react';
import { useTargetContext } from '@/context';
import {
  getAllTargets,
  insertTarget,
  updateTargetById,
  deleteTargetById,
  setFavouriteTarget,
  unsetFavouriteTarget,
} from '@/db';
import type { Target, TargetFormData } from '@/types';

/**
 * The central hook for reading and changing goals. Wraps the create,
 * update and delete calls so every screen touches goal data through
 * one place.
 */
export function useTargets() {
  const { targets, setTargets } = useTargetContext();

  const refreshTargets = useCallback(async () => {
    const rows = await getAllTargets();
    setTargets(rows);
  }, [setTargets]);

  const addTarget = useCallback(
    async (formData: TargetFormData) => {
      await insertTarget(formData);
      await refreshTargets();
    },
    [refreshTargets],
  );

  const updateTarget = useCallback(
    async (id: number, formData: TargetFormData) => {
      await updateTargetById(id, formData);
      await refreshTargets();
    },
    [refreshTargets],
  );

  const deleteTarget = useCallback(
    async (id: number) => {
      await deleteTargetById(id);
      await refreshTargets();
    },
    [refreshTargets],
  );

  const toggleFavourite = useCallback(
    async (target: Target) => {
      if (target.isFavourite) await unsetFavouriteTarget(target.id);
      else await setFavouriteTarget(target.id);
      await refreshTargets();
    },
    [refreshTargets],
  );

  const findTargetById = useCallback(
    (id: number) => {
      return targets.find((t) => t.id === id);
    },
    [targets],
  );

  return {
    targets,
    addTarget,
    updateTarget,
    deleteTarget,
    toggleFavourite,
    findTargetById,
    refreshTargets,
  };
}
