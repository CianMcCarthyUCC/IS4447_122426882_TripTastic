import { createContext, useContext, type Context } from 'react';

/**
 * Small factory that builds the list + setter context every entity in
 * the app needs (activities, categories, goals). Returns a React context,
 * a hook that reads it, and a stable type alias, so each entity file is
 * a single-line call instead of the same fifteen lines copied over.
 */

export type EntityContextType<TKey extends string, T> = {
  [K in TKey]: T[];
} & {
  [K in `set${Capitalize<TKey>}`]: React.Dispatch<React.SetStateAction<T[]>>;
};

export function createEntityContext<TKey extends string, T>(
  /** Plural entity key used in the context value ("activities", "categories", "targets"). */
  key: TKey,
  /** Article + singular label used in the error message ("an Activity", "a Category"). */
  label: string,
): {
  Context: Context<EntityContextType<TKey, T> | null>;
  useEntityContext: () => EntityContextType<TKey, T>;
} {
  const Ctx = createContext<EntityContextType<TKey, T> | null>(null);
  Ctx.displayName = `${key}Context`;

  function useEntityContext(): EntityContextType<TKey, T> {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error(`use${label}Context must be used within ${label}Context.Provider`);
    }
    return ctx;
  }

  return { Context: Ctx, useEntityContext };
}
