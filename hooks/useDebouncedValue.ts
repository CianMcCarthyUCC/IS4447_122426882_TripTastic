import { useEffect, useState } from 'react';

/**
 * A debounce helper used mainly for search inputs. Holds off on
 * reporting a new value until the user has paused, so filters and
 * charts don't re-run on every single keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
