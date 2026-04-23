import { useEffect, useState } from 'react';
import Toast from '../Toast/Toast';
import { subscribeToasts, type GlobalToast as GlobalToastPayload } from '@/hooks/toastBus';

/**
 * Renders the single app-wide Toast, fed by messages emitted via
 * `emitToast(...)`. Lives at the root so screens that navigate away
 * after firing a toast (e.g. add-entity modals on save) don't take
 * the notification down with them.
 */
export function GlobalToast() {
  const [toast, setToast] = useState<GlobalToastPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      subscribeToasts((next) => {
        setToast(next);
        setVisible(true);
      }),
    [],
  );

  return (
    <Toast
      visible={visible}
      message={toast?.message ?? ''}
      variant={toast?.variant}
      position="bottom"
      onHide={() => setVisible(false)}
    />
  );
}
