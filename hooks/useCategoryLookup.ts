import { useMemo } from 'react';
import type { Category } from '@/types';

/**
 * A shared helper that gives other components a quick way to look up a
 * category by its id. Avoids every list and insights screen rebuilding
 * the same map on its own.
 */
export function useCategoryLookup(categories: Category[]): Map<number, Category> {
  return useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
}
