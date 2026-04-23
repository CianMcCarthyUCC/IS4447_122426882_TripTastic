import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useMountedRef } from '@/hooks/useMountedRef';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { CategoryContext } from './CategoryContext';
import { ActivityContext } from './ActivityContext';
import { TargetContext } from './TargetContext';
import { TripContext } from './TripContext';
import { getAllCategories, getAllActivities, getAllTargets, getAllTrips, seedDataIfEmpty, findUserById } from '@/db';
import { getSession } from '@/utils/auth';
import { configureNotifications } from '@/utils/notifications';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { useStreakNotifications } from '@/hooks/useStreakNotifications';
import type { Category, Activity, Target, Trip, User } from '@/types';

type Props = { children: ReactNode };

export default function AppProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const mounted = useMountedRef();
  // Track the last *id* we loaded data for - re-running the full seed +
  // multi-table fetch on every `setUser` (including edit-profile writes
  // that replace the user object with identical id) was wasteful and
  // briefly flashed stale lists while the promises re-resolved.
  const loadedUserIdRef = useRef<number | null>(null);

  useEffect(() => { configureNotifications(); }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const userId = await getSession();
        if (userId && mounted.current) {
          const restored = await findUserById(userId);
          if (restored && mounted.current) setUser(restored);
        }
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (!user) {
      loadedUserIdRef.current = null;
      return;
    }
    // Skip the full reload when the same logged-in user's object was
    // replaced by an unrelated write (e.g. profile edit). The caller can
    // update the individual slices directly; we don't need to re-fetch
    // everything from SQLite just because `user` got a new identity.
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;

    const loadData = async () => {
      try {
        await seedDataIfEmpty();
        const [cats, acts, tgts, trps] = await Promise.all([
          getAllCategories(), getAllActivities(), getAllTargets(), getAllTrips(),
        ]);
        if (!mounted.current) return;
        setCategories(cats);
        setActivities(acts);
        setTargets(tgts);
        setTrips(trps);
        // Functional form avoids pulling `currentTrip` into the deps
        // array - we only want to seed it on the first load for this
        // user, not re-run the effect whenever the selection changes.
        setCurrentTrip((prev) => prev ?? trps[0] ?? null);
      } catch (e) {
        console.error('Failed to load app data:', e);
      }
    };
    void loadData();
  }, [user, mounted]);

  const authValue = useMemo(() => ({ user, isAuthenticated: user !== null, isLoading, setUser }), [user, isLoading]);
  const categoryValue = useMemo(() => ({ categories, setCategories }), [categories]);
  const activityValue = useMemo(() => ({ activities, setActivities }), [activities]);
  const targetValue = useMemo(() => ({ targets, setTargets }), [targets]);
  const tripValue = useMemo(() => ({ trips, setTrips, currentTrip, setCurrentTrip }), [trips, currentTrip]);

  return (
    <AuthContext.Provider value={authValue}>
      <TripContext.Provider value={tripValue}>
        <CategoryContext.Provider value={categoryValue}>
          <ActivityContext.Provider value={activityValue}>
            <TargetContext.Provider value={targetValue}>
              <GoalNotificationWatcher />
              {children}
            </TargetContext.Provider>
          </ActivityContext.Provider>
        </CategoryContext.Provider>
      </TripContext.Provider>
    </AuthContext.Provider>
  );
}

/**
 * A small invisible component that sits inside the app's providers and
 * watches for moments worth notifying the user about, such as hitting a
 * goal or extending a streak.
 */
const GoalNotificationWatcher = memo(function GoalNotificationWatcher() {
  useGoalNotifications();
  useStreakNotifications();
  return null;
});
