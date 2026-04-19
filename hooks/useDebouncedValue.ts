import { useEffect, useState } from 'react';

/**
 * Returns a version of `value` that only updates after `delay` ms of
 * no changes. Canonical debounce hook — used to keep text-input driven
 * filter pipelines from thrashing re-renders / re-computing memos on
 * every keystroke.
 *
 * Default 300ms matches the UX sweet spot cited by Algolia / NN/g:
 * low enough to still feel instant, high enough that a user typing
 * at normal speed doesn't kick off work mid-word.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
