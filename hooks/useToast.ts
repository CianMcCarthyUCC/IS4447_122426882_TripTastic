import { useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

/**
 * Hook for managing toast notification state.
 * Returns state + show/hide functions.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  });

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ visible: true, message, variant });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
