import { createContext, useContext } from 'react';
import type { Category } from '@/types';

export type CategoryContextType = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
};

export const CategoryContext = createContext<CategoryContextType | null>(null);

export function useCategoryContext(): CategoryContextType {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryContext.Provider');
  }
  return context;
}
