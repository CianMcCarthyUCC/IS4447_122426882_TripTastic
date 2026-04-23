import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Href } from 'expo-router';
import { useActivityContext } from '@/context/ActivityContext';
import { useTargetContext } from '@/context/TargetContext';
import { useCategoryContext } from '@/context/CategoryContext';
import { useTripContext } from '@/context/TripContext';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';
import { computeStreaks } from '@/utils/streakCalculator';
import { computeTargetCurrentValue } from '@/utils/progressHelpers';

export type NotificationKind = 'streak' | 'goal-met' | 'goal-close' | 'trip-soon' | 'trip-now';

export type Notification = {
  /** Stable identifier - used as the list key and lets the UI dedupe. */
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Ionicon name for the leading bubble. */
  icon: 'flame' | 'trophy' | 'trending-up' | 'airplane' | 'compass';
  /** Higher number = shown earlier. Ties broken by insertion order. */
  priority: number;
  /**
   * Where tapping the row should land the user. Uses Expo Router's Href
   * shape directly so screens/hooks don't need a translation layer.
   */
  href: Href;
};

export type NotificationsApi = {
  notifications: Notification[];
  /** Hide a single notification for the rest of this session. */
  dismiss: (id: string) => void;
  /** Hide every currently visible notification. */
  clearAll: () => void;
};

// ── Module-level dismissal store ─────────────────────────────────
// Session-scoped on purpose: notifications are a *derivation* of live
// state (streaks, goal progress, trip dates). Persisting dismissals to
// SQLite would add schema weight for a UI affordance that resolves
// itself naturally on the next cold start. If the underlying condition
// still applies tomorrow, the user probably wants to see the nudge again.
const dismissed = new Set<string>();
const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

/**
 * Builds the in-app notification list shown in the top-right panel.
 * Pulls from streaks, goals and upcoming trips, and tracks which
 * notifications the user has dismissed this session.
 */
export function useNotifications(): NotificationsApi {
  const { activities } = useActivityContext();
  const { targets } = useTargetContext();
  const { categories } = useCategoryContext();
  const { trips } = useTripContext();
  const categoryMap = useCategoryLookup(categories);

  // Subscribe to dismissal changes. The counter value is unused - it's
  // just a cheap way to force a re-render when the shared set mutates.
  const [dismissTick, setDismissTick] = useState(0);
  useEffect(() => {
    const listener = () => setDismissTick((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const notifications = useMemo(() => {
    const items: Notification[] = [];

    // ── Streak milestone ──────────────────────────────
    // One global streak - consecutive days with any activity logged. We
    // only surface it at 3+ days so short runs don't spam the feed; longer
    // runs earn louder copy to reinforce the habit.
    const streak = computeStreaks(activities);
    if (streak.currentStreak >= 3) {
      let body: string;
      if (streak.currentStreak >= 30) {
        body = `🔥 ${streak.currentStreak}-day streak - legendary!`;
      } else if (streak.currentStreak >= 14) {
        body = `${streak.currentStreak} days in a row. Keep it going!`;
      } else if (streak.currentStreak >= 7) {
        body = `One full week of activity. Nice rhythm.`;
      } else {
        body = `${streak.currentStreak} days of activity logged in a row.`;
      }
      items.push({
        id: 'streak-daily',
        kind: 'streak',
        title: `${streak.currentStreak}-day streak`,
        body,
        icon: 'flame',
        // Longer streaks should float to the top.
        priority: 60 + Math.min(streak.currentStreak, 40),
        // Streaks are surfaced on the Insights tab alongside charts and
        // target progress - the most natural deep-link for the nudge.
        href: '/(tabs)/insights',
      });
    }

    // ── Goal progress ─────────────────────────────────
    for (const t of targets) {
      const current = computeTargetCurrentValue(t, activities);
      const name = categoryMap.get(t.categoryId)?.name ?? 'Goal';
      // Target detail screen has the progress bar + edit affordance, which
      // is exactly where users can *do* something after the nudge.
      const href: Href = { pathname: '/target/[id]', params: { id: t.id.toString() } };
      if (current >= t.targetValue) {
        items.push({
          id: `goal-met-${t.id}`,
          kind: 'goal-met',
          title: `Goal met: ${name}`,
          body:
            current > t.targetValue
              ? `You exceeded your ${t.period} ${name.toLowerCase()} goal by ${current - t.targetValue}.`
              : `You hit your ${t.period} ${name.toLowerCase()} goal. Well done.`,
          icon: 'trophy',
          priority: 90,
          href,
        });
      } else {
        const remaining = t.targetValue - current;
        const within20 = remaining <= t.targetValue * 0.2 && remaining > 0;
        if (within20) {
          items.push({
            id: `goal-close-${t.id}`,
            kind: 'goal-close',
            title: `Almost there: ${name}`,
            body: `Only ${remaining} to go on your ${t.period} ${name.toLowerCase()} goal.`,
            icon: 'trending-up',
            priority: 70,
            href,
          });
        }
      }
    }

    // ── Trip timing ───────────────────────────────────
    // Using the plain ISO slice for "today" keeps this consistent with
    // the rest of the app's date comparisons (strings, not Date math).
    const today = new Date().toISOString().slice(0, 10);
    for (const trip of trips) {
      // Tapping a trip notification lands directly on the activities list
      // for that trip - that's where logging / reviewing happens.
      const href: Href = {
        pathname: '/trip/[id]/activities',
        params: { id: trip.id.toString() },
      };
      if (trip.startDate <= today && trip.endDate >= today) {
        items.push({
          id: `trip-now-${trip.id}`,
          kind: 'trip-now',
          title: `${trip.name} is happening`,
          body: `You're on this trip right now. Log activities as you go.`,
          icon: 'compass',
          priority: 100,
          href,
        });
        continue;
      }
      if (trip.startDate > today) {
        const days = Math.round(
          (new Date(trip.startDate + 'T00:00:00').getTime() -
            new Date(today + 'T00:00:00').getTime()) /
            86400000,
        );
        if (days <= 7) {
          items.push({
            id: `trip-soon-${trip.id}`,
            kind: 'trip-soon',
            title: `${trip.name} in ${days === 0 ? '<1' : days} day${days === 1 ? '' : 's'}`,
            body: `Starts ${trip.startDate}. Time to finalise your plans.`,
            icon: 'airplane',
            priority: 80 - days,
            href,
          });
        }
      }
    }

    return items
      .filter((n) => !dismissed.has(n.id))
      .sort((a, b) => b.priority - a.priority);
    // `dismissTick` participates in the deps so the memo recomputes after
    // a dismiss/clearAll - values of the set itself change outside React.
  }, [activities, targets, categoryMap, trips, dismissTick]);

  const dismiss = useCallback((id: string) => {
    dismissed.add(id);
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    // Snapshot the currently visible ids so re-computing (which can pull
    // new notifications in) doesn't immediately re-populate the list.
    for (const n of notifications) dismissed.add(n.id);
    notifyListeners();
  }, [notifications]);

  return { notifications, dismiss, clearAll };
}
