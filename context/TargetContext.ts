import { createContext, useContext } from 'react';
import type { Target } from '@/types';

export type TargetContextType = {
  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
};

export const TargetContext = createContext<TargetContextType | null>(null);

export function useTargetContext(): TargetContextType {
  const context = useContext(TargetContext);
  if (!context) {
    throw new Error('useTargetContext must be used within a TargetContext.Provider');
  }
  return context;
}
