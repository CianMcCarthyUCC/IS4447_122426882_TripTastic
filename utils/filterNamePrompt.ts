import { Alert, Platform } from 'react-native';

/**
 * Prompt the user for a name for the filter they're about to save.
 *
 * Uses `Alert.prompt` on iOS (native inline input). Android has no
 * equivalent, so we fall back to a templated name derived from the
 * active filter keys/values — good enough to tell saved filters apart
 * at a glance. Callers can always long-press a chip to remove a
 * mis-named preset later.
 *
 * Returns `null` if the user cancels on iOS. On Android this always
 * resolves with a synthesised name (no cancel path).
 */
export function promptFilterName(
  fallbackHint: string,
): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      Alert.prompt(
        'Save filter',
        'Give this filter a short name so you can recall it later.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          {
            text: 'Save',
            onPress: (value?: string) => {
              const trimmed = value?.trim();
              resolve(trimmed && trimmed.length > 0 ? trimmed : fallbackHint);
            },
          },
        ],
        'plain-text',
        fallbackHint,
      );
    });
  }
  // Android — use the fallback hint directly; a modal with FormField
  // would bloat the screen tree for a marginal UX win. User can always
  // remove + re-save if they dislike the name.
  return Promise.resolve(fallbackHint);
}

/**
 * Build a short human-readable summary of an active filter state for
 * use as a default name, e.g. `{selectedCategory: '3', dateRange: 'week'}`
 * → "Food · week". Unknown keys are skipped.
 */
export function describeFilter(
  state: Record<string, string>,
  categoryNameById: Map<number, string>,
): string {
  const parts: string[] = [];
  if (state.selectedCategory && state.selectedCategory !== 'all') {
    const name = categoryNameById.get(Number(state.selectedCategory));
    if (name) parts.push(name);
  }
  if (state.status && state.status !== 'all') parts.push(state.status);
  if (state.dateRange && state.dateRange !== 'all') parts.push(state.dateRange);
  if (state.year && state.year !== 'all') parts.push(state.year);
  if (state.searchQuery) parts.push(`"${state.searchQuery.slice(0, 12)}"`);
  return parts.length > 0 ? parts.join(' · ') : 'My filter';
}
