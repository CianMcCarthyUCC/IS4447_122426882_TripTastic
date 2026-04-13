import { createContext, useContext } from 'react';
import type { Trip } from '@/types';

export type TripContextType = {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  currentTrip: Trip | null;
  setCurrentTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
};

export const TripContext = createContext<TripContextType | null>(null);

export function useTripContext(): TripContextType {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripContext.Provider');
  }
  return context;
}
