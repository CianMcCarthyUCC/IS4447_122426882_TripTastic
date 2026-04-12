import { useCallback } from 'react';
import { useTargetContext } from '@/context';
import { getAllTargets, insertTarget, updateTargetById, deleteTargetById } from '@/db';
import type { TargetFormData } from '@/types';

/**
 * Central hook for all target CRUD operations.
 * Handles DATA only — no navigation.
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
    findTargetById,
    refreshTargets,
  };
}
