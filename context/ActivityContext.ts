import { createEntityContext, type EntityContextType } from './createEntityContext';
import type { Activity } from '@/types';

export type ActivityContextType = EntityContextType<'activities', Activity>;

const { Context, useEntityContext } = createEntityContext<'activities', Activity>(
  'activities',
  'Activity',
);

export const ActivityContext = Context;
export const useActivityContext = useEntityContext;
