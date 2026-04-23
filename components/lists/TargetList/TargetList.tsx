import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { TargetCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import { useCategoryLookup } from '@/hooks';
import { computeTargetCurrentValue } from '@/utils/progressHelpers';
import type { ReactElement } from 'react';
import type { Target, Category, Activity } from '@/types';

type Props = {
  targets: Target[];
  categories: Category[];
  activities: Activity[];
  /**
   * Fires when the user taps the star on a goal card. Omit on read-only
   * surfaces so the inline actions stay hidden.
   */
  onToggleFavourite?: (target: Target) => void;
  /** Inline delete action - forwarded to each card. */
  onDelete?: (target: Target) => void;
  /**
   * Rendered at the top of the scrollable surface, so the whole goals
   * section scrolls as one (header stays within the scroll rather than
   * floating above it).
   */
  listHeaderComponent?: ReactElement | null;
  /**
   * Override the default "No goals yet" empty state.
   */
  listEmptyComponent?: ReactElement | null;
};

/**
 * Vertical list of goal cards for the Goals tab of a trip. Uses a plain
 * ScrollView + mapped cards rather than a FlatList so it can be safely
 * nested inside a parent scroll surface without tripping the
 * "VirtualizedLists nested inside ScrollViews" warning. Goal lists stay
 * small in practice, so the virtualisation saving is not worth the
 * nesting friction.
 */
export default function TargetList({
  targets,
  categories,
  activities,
  onToggleFavourite,
  onDelete,
  listHeaderComponent,
  listEmptyComponent,
}: Props) {
  const categoryMap = useCategoryLookup(categories);

  const currentValues = useMemo(
    () => new Map(targets.map((t) => [t.id, computeTargetCurrentValue(t, activities)])),
    [targets, activities],
  );

  return (
    <ScrollView
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Goals list"
    >
      {listHeaderComponent ?? null}
      {targets.length === 0 ? (
        listEmptyComponent ?? defaultEmptyComponent
      ) : (
        <View>
          {targets.map((t) => (
            <TargetCard
              key={t.id}
              target={t}
              category={categoryMap.get(t.categoryId)}
              currentValue={currentValues.get(t.id) ?? 0}
              onToggleFavourite={onToggleFavourite}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const defaultEmptyComponent = (
  <EmptyState
    title="No goals yet"
    message="Goals let you set weekly or monthly targets - like '300 min of sightseeing per week'. Tap + to set your first goal!"
  />
);
