import { Alert, Platform } from 'react-native';

/**
 * Asks the user what to call a filter they are about to save. On iOS
 * this opens a small name prompt; on Android, where no such prompt
 * exists, it generates a readable name from the active filter settings.
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
  // Android - use the fallback hint directly; a modal with FormField
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
  categoryById: Map<number, { name: string }>,
): string {
  const parts: string[] = [];
  if (state.selectedCategory && state.selectedCategory !== 'all') {
    const name = categoryById.get(Number(state.selectedCategory))?.name;
    if (name) parts.push(name);
  }
  if (state.status && state.status !== 'all') parts.push(state.status);
  if (state.dateRange && state.dateRange !== 'all') parts.push(state.dateRange);
  if (state.year && state.year !== 'all') parts.push(state.year);
  if (state.searchQuery) parts.push(`"${state.searchQuery.slice(0, 12)}"`);
  return parts.length > 0 ? parts.join(' · ') : 'My filter';
}
