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
 * Looks after the daily reminder preference. Picks up the current
 * on/off state from the system at start-up and exposes a single toggle
 * that handles the permission prompt and scheduling in one go.
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
