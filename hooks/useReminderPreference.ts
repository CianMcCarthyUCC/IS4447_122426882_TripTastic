import { useCallback, useEffect, useState } from 'react';
import {
  cancelAllNotifications,
  isDailyReminderScheduled,
  requestNotificationPermissions,
  scheduleDailyReminder,
} from '@/utils/notifications';

export type ReminderToggleResult =
  | 'enabled'
  | 'disabled'
  | 'permission-denied'
  | 'error';

/**
 * Owns the daily-reminder preference: hydrates from the OS on mount (so a
 * cold start reflects any pre-existing schedule instead of defaulting to
 * off) and exposes a single `toggle` that handles the permission request,
 * scheduling/cancellation, and state update together.
 *
 * Callers decide how to surface success/failure — the hook returns a tag
 * rather than firing toasts so it stays UI-agnostic and reusable from any
 * screen that wants a reminder switch.
 */
export function useReminderPreference() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isDailyReminderScheduled().then((active) => {
      if (!cancelled) setEnabled(active);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (next: boolean): Promise<ReminderToggleResult> => {
    try {
      if (next) {
        const granted = await requestNotificationPermissions();
        if (!granted) return 'permission-denied';
        await scheduleDailyReminder();
        setEnabled(true);
        return 'enabled';
      }
      await cancelAllNotifications();
      setEnabled(false);
      return 'disabled';
    } catch {
      return 'error';
    }
  }, []);

  return { enabled, toggle };
}
