import { useEffect, useMemo, useState } from 'react';
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
    if (!user) return;
    const loadData = async () => {
      try {
        await seedDataIfEmpty();
        const [cats, acts, tgts, trps] = await Promise.all([
          getAllCategories(), getAllActivities(), getAllTargets(), getAllTrips(),
        ]);
        if (mounted.current) {
          setCategories(cats);
          setActivities(acts);
          setTargets(tgts);
          setTrips(trps);
          if (trps.length > 0 && !currentTrip) setCurrentTrip(trps[0]);
        }
      } catch (e) {
        console.error('Failed to load app data:', e);
      }
    };
    void loadData();
  }, [user]);

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

/** Renders inside all providers so it can access every context. */
function GoalNotificationWatcher() {
  useGoalNotifications();
  return null;
}
