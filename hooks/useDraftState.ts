import { useCallback, useEffect, useState } from 'react';

/**
 * Manages a local "draft" copy of a value while the user edits it in a
 * sheet or modal. Seeds the draft when the sheet opens and then leaves
 * it alone, so the user's in-progress changes are never overwritten by
 * outside updates.
 */
export function useDraftState<T>(committed: T, isOpen: boolean) {
  const [draft, setDraft] = useState<T>(committed);

  useEffect(() => {
    if (isOpen) setDraft(committed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      setDraft((d) => ({ ...(d as object), [key]: value } as T)),
    [],
  );

  return { draft, setDraft, updateField } as const;
}
