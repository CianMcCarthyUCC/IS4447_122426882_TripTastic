import { useEffect, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'accent';

export type GlobalToast = {
  message: string;
  variant: ToastVariant;
  /** Monotonically-increasing id so re-firing the same message re-triggers the Toast. */
  id: number;
};

type Listener = (toast: GlobalToast) => void;

const listeners = new Set<Listener>();
let nextId = 1;

/**
 * Fire a toast from anywhere - including screens that are about to
 * unmount (e.g. an add-entity modal that navigates back on save). The
 * root layout subscribes once and renders the toast, so the message
 * survives the source screen going away.
 */
export function emitToast(message: string, variant: ToastVariant = 'success') {
  const toast: GlobalToast = { message, variant, id: nextId++ };
  for (const l of listeners) l(toast);
}

/**
 * Used by the root-level <GlobalToast /> listener to subscribe for
 * messages fired via emitToast. Returns an unsubscribe function.
 */
export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Convenience hook for the global Toast component at the root - holds
 * the latest emitted toast and re-renders on every new message.
 */
export function useGlobalToast() {
  const [toast, setToast] = useState<GlobalToast | null>(null);
  useEffect(() => subscribeToasts(setToast), []);
  return { toast, clear: () => setToast((prev) => (prev ? { ...prev, message: '' } : prev)) };
}
