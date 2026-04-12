import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { CategoryContext } from './CategoryContext';
import { ActivityContext } from './ActivityContext';
import { TargetContext } from './TargetContext';
import { getAllCategories, getAllActivities, getAllTargets, seedDataIfEmpty, findUserById, initializeDatabase } from '@/db';
import { getSession } from '@/utils/auth';
import type { Category, Activity, Target, User } from '@/types';

type Props = {
  children: ReactNode;
};

/**
 * Combined provider — wraps the app with auth, category, activity, and target state.
 * Restores session on launch, seeds database, then loads all data.
 * Context values are memoized to prevent unnecessary consumer re-renders.
 */
export default function AppProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  // Initialize database and restore session on mount
  useEffect(() => {
    const init = async () => {
      try {
        initializeDatabase();
        const userId = await getSession();
        if (userId) {
          const restored = await findUserById(userId);
          if (restored) setUser(restored);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  // Load app data once authenticated
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      await seedDataIfEmpty();
      const [cats, acts, tgts] = await Promise.all([
        getAllCategories(),
        getAllActivities(),
        getAllTargets(),
      ]);
      setCategories(cats);
      setActivities(acts);
      setTargets(tgts);
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
