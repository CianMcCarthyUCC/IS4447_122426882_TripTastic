import { createContext, useContext } from 'react';
import type { Activity } from '@/types';

export type ActivityContextType = {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
};

export const ActivityContext = createContext<ActivityContextType | null>(null);

export function useActivityContext(): ActivityContextType {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityContext must be used within an ActivityContext.Provider');
  }
  return context;
}
