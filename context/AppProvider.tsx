import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { CategoryContext } from './CategoryContext';
import { ActivityContext } from './ActivityContext';
import { TargetContext } from './TargetContext';
import { getAllCategories, getAllActivities, getAllTargets, seedDataIfEmpty, findUserById } from '@/db';
import { getSession } from '@/utils/auth';
import type { Category, Activity, Target, User } from '@/types';

type Props = {
  children: ReactNode;
};

/**
 * Combined provider — wraps the app with auth, category, activity, and target state.
 * Uses mounted ref to prevent state updates after unmount (memory leak fix).
 */
export default function AppProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // Restore session on mount
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

  // Load app data once authenticated
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        await seedDataIfEmpty();
        const [cats, acts, tgts] = await Promise.all([
          getAllCategories(),
          getAllActivities(),
          getAllTargets(),
        ]);
        if (mounted.current) {
          setCategories(cats);
          setActivities(acts);
          setTargets(tgts);
        }
      } catch (e) {
        console.error('Failed to load app data:', e);
      }
    };

    void loadData();
  }, [user]);

  const authValue = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, setUser }),
    [user, isLoading],
  );

  const categoryValue = useMemo(
    () => ({ categories, setCategories }),
    [categories],
  );

  const activityValue = useMemo(
    () => ({ activities, setActivities }),
    [activities],
  );

  const targetValue = useMemo(
    () => ({ targets, setTargets }),
    [targets],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <CategoryContext.Provider value={categoryValue}>
        <ActivityContext.Provider value={activityValue}>
          <TargetContext.Provider value={targetValue}>
            {children}
          </TargetContext.Provider>
        </ActivityContext.Provider>
      </CategoryContext.Provider>
    </AuthContext.Provider>
  );
}
