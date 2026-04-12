import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CategoryContext } from './CategoryContext';
import { ActivityContext } from './ActivityContext';
import { TargetContext } from './TargetContext';
import { getAllCategories, getAllActivities, getAllTargets, seedDataIfEmpty } from '@/db';
import type { Category, Activity, Target } from '@/types';

type Props = {
  children: ReactNode;
};

/**
 * Combined provider — wraps the app with category, activity, and target state.
 * Seeds the database on first launch, then loads all data.
 * Context values are memoized to prevent unnecessary consumer re-renders.
 */
export default function AppProvider({ children }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
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
  }, []);

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
    <CategoryContext.Provider value={categoryValue}>
      <ActivityContext.Provider value={activityValue}>
        <TargetContext.Provider value={targetValue}>
          {children}
        </TargetContext.Provider>
      </ActivityContext.Provider>
    </CategoryContext.Provider>
  );
}
