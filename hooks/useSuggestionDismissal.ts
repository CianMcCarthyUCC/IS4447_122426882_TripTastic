import { useCallback, useEffect, useState } from 'react';

/**
 * Remembers which suggestion chips the user has dismissed for the
 * current session. Once dismissed, a chip stays hidden until the next
 * app start, so the app stops pestering the user about the same idea.
 */
const dismissed = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useSuggestionDismissal() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isDismissed = useCallback((key: string) => dismissed.has(key), []);

  const dismiss = useCallback((key: string) => {
    dismissed.add(key);
    notify();
  }, []);

  return { isDismissed, dismiss };
}
