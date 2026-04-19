import { useCallback, useEffect, useState } from 'react';

/**
 * Session-scoped dismissal store for suggestion chips.
 *
 * Mirrors the notification-dismissal pattern in useNotifications.ts — a
 * module-level Set + pub/sub so every mounted consumer (Activities,
 * Trips, Goals) stays in sync when one chip is dismissed. Re-appears on
 * cold start if the underlying rule still fires, because the suggestion
 * is a *derivation* of live data, not user preference.
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
