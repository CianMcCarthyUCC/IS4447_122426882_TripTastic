import { useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'accent';

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

/**
 * The hook every screen uses to show a toast message. Hands back the
 * current toast state along with simple show and hide functions, so any
 * component can fire a toast without having to wire up its own timing.
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
