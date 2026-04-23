import { useEffect, useRef } from 'react';

/**
 * A tiny helper that lets a component know whether it is still on
 * screen. Used to guard async work that finishes after the component
 * has already been unmounted.
 */
export function useMountedRef() {
  const mounted = useRef(true);

  // Reset on every mount, not just initial ref creation. Strict Mode and
  // React's remount-on-focus behaviour run the cleanup once and then
  // remount the same fiber - without re-asserting `true` here, the ref
  // stays `false` forever and async state updates get silently dropped.
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  return mounted;
}
