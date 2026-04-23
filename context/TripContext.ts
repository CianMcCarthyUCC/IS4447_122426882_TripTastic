import { createEntityContext, type EntityContextType } from './createEntityContext';
import type { Trip } from '@/types';

/**
 * Trip context holds the list plus the currently-selected trip, so
 * screens can quickly pick up whichever trip the user is working with
 * without having to pass it down through props.
 */
export type TripContextType = EntityContextType<'trips', Trip> & {
  currentTrip: Trip | null;
  setCurrentTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
};

const { Context, useEntityContext } = createEntityContext<'trips', Trip>(
  'trips',
  'Trip',
);

export const TripContext = Context as React.Context<TripContextType | null>;

export function useTripContext(): TripContextType {
  return useEntityContext() as TripContextType;
}
