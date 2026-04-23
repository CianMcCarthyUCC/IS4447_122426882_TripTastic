import { createEntityContext, type EntityContextType } from './createEntityContext';
import type { Target } from '@/types';

export type TargetContextType = EntityContextType<'targets', Target>;

const { Context, useEntityContext } = createEntityContext<'targets', Target>(
  'targets',
  'Target',
);

export const TargetContext = Context;
export const useTargetContext = useEntityContext;
