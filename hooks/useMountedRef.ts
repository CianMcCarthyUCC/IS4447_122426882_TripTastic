import { useEffect, useRef } from 'react';

/**
 * Returns a ref that tracks whether the component is still mounted.
 * Use to guard async setState calls and prevent memory leaks.
 */
export function useMountedRef() {
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  return mounted;
}
