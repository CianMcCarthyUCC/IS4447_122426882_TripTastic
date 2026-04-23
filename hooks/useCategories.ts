import { useCallback } from 'react';
import { useCategoryContext } from '@/context';
import { getAllCategories, insertCategory, updateCategoryById, deleteCategoryById } from '@/db';
import type { CategoryFormData } from '@/types';

/**
 * The central hook for reading and changing categories. Wraps the
 * create, update and delete calls so every screen touches category
 * data through one place.
 */
export function useCategories() {
  const { categories, setCategories } = useCategoryContext();

  const refreshCategories = useCallback(async () => {
    const rows = await getAllCategories();
    setCategories(rows);
  }, [setCategories]);

  const addCategory = useCallback(
    async (formData: CategoryFormData): Promise<number> => {
      const newId = await insertCategory(formData);
      await refreshCategories();
      return newId;
    },
    [refreshCategories],
  );

  const updateCategory = useCallback(
    async (id: number, formData: CategoryFormData) => {
      await updateCategoryById(id, formData);
      await refreshCategories();
    },
    [refreshCategories],
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      await deleteCategoryById(id);
      await refreshCategories();
    },
    [refreshCategories],
  );

  const findCategoryById = useCallback(
    (id: number) => {
      return categories.find((c) => c.id === id);
    },
    [categories],
  );

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    refreshCategories,
  };
}
