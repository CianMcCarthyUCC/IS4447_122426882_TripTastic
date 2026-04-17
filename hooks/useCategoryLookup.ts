import { useMemo } from 'react';
import type { Category } from '@/types';

/**
 * Memoised Map of categoryId → Category for O(1) lookups.
 * Use `.get(id)?.name` or `.get(id)?.color` at call sites.
 *
 * Replaces the repeated `useMemo(() => new Map(categories.map(...)), [categories])`
 * pattern in list components and insights screens.
 */
export function useCategoryLookup(categories: Category[]): Map<number, Category> {
  return useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
}
