import { createEntityContext, type EntityContextType } from './createEntityContext';
import type { Category } from '@/types';

export type CategoryContextType = EntityContextType<'categories', Category>;

const { Context, useEntityContext } = createEntityContext<'categories', Category>(
  'categories',
  'Category',
);

export const CategoryContext = Context;
export const useCategoryContext = useEntityContext;
