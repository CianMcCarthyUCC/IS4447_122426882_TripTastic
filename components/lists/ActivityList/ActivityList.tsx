import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityCard } from '@/components/cards';
import { CreateEmptyCard } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import { useCategoryLookup } from '@/hooks';
import type { ReactElement } from 'react';
import type { Activity, Category } from '@/types';

type Props = {
  activities: Activity[];
  categories: Category[];
  /**
   * Forwarded to each `ActivityCard`. Omit on read-only surfaces
   * (past-trip recap) so the star control isn't rendered there.
   */
  onToggleFavourite?: (activity: Activity) => void;
  /**
   * Flips an activity between planned and completed. Omit on read-only
   * surfaces so the inline status chip stays non-interactive.
   */
  onToggleComplete?: (activity: Activity) => void;
  /** Inline delete action - forwarded to each card. */
  onDelete?: (activity: Activity) => void;
  /**
   * Rendered as the first row of the scrollable surface. Use this for
   * SearchBar / SegmentedPills / SuggestionChip so the
   * whole section scrolls as one gesture surface - a drag on the search
   * bar is in-bounds for the FlatList's pan recognizer. Without it, the
   * pre-list UI sits outside the scrollable and drags on it do nothing.
   */
  listHeaderComponent?: ReactElement | null;
  /**
   * Override the default "No activities yet" empty state - e.g. swap in
   * a "No results, try a different search" message when the list is
   * empty because of active filters rather than zero data.
   */
  listEmptyComponent?: ReactElement | null;
};

export default function ActivityList({
  activities,
  categories,
  onToggleFavourite,
  onToggleComplete,
  onDelete,
  listHeaderComponent,
  listEmptyComponent,
}: Props) {
  const categoryMap = useCategoryLookup(categories);
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityCard
        activity={item}
        category={categoryMap.get(item.categoryId)}
        onToggleFavourite={onToggleFavourite}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
      />
    ),
    [categoryMap, onToggleFavourite, onToggleComplete, onDelete],
  );

  return (
    <FlatList
      data={activities}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      // Dragging to scroll dismisses the SearchBar keyboard - the native
      // pattern, and our replacement for the old tap-on-background dismiss
      // wrapper that was intercepting pan gestures on empty space.
      keyboardDismissMode="on-drag"
      // Taps on ActivityCards are delivered on the first tap instead of
      // being swallowed by the default dismiss-on-first-tap behaviour.
      keyboardShouldPersistTaps="handled"
      accessibilityRole="list"
      accessibilityLabel="Activities list"
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={
        listEmptyComponent ?? (
          <CreateEmptyCard
            onPress={() => router.push('/activity/add')}
            icon="add"
            backgroundIcon="compass"
            title="No activities yet"
            helper="Tap to log your first sightseeing stop, meal or transport leg."
            accessibilityLabel="Log your first activity"
          />
        )
      }
    />
  );
}

const keyExtractor = (item: Activity) => item.id.toString();
