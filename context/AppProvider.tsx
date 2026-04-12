import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CategoryContext } from './CategoryContext';
import { ActivityContext } from './ActivityContext';
import { getAllCategories, getAllActivities, seedDataIfEmpty } from '@/db';
import type { Category, Activity } from '@/types';

type Props = {
  children: ReactNode;
};

/**
 * Combined provider — wraps the app with both category and activity state.
 * Seeds the database on first launch, then loads all data.
 * Context values are memoized to prevent unnecessary consumer re-renders.
 */
export default function AppProvider({ children }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await seedDataIfEmpty();
      const [cats, acts] = await Promise.all([getAllCategories(), getAllActivities()]);
      setCategories(cats);
      setActivities(acts);
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

  return (
    <CategoryContext.Provider value={categoryValue}>
      <ActivityContext.Provider value={activityValue}>
        {children}
      </ActivityContext.Provider>
    </CategoryContext.Provider>
  );
}
