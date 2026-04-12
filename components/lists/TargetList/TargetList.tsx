import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { TargetCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Target, Category, Activity } from '@/types';

type Props = {
  targets: Target[];
  categories: Category[];
  activities: Activity[];
};

/**
 * Computes the current metric sum for a given target by
 * matching activities on categoryId (and tripId if not global).
 */
function computeCurrentValue(target: Target, activities: Activity[]): number {
  return activities
    .filter((a) => {
      if (a.categoryId !== target.categoryId) return false;
      if (target.tripId !== null && a.tripId !== target.tripId) return false;
      return true;
    })
    .reduce((sum, a) => sum + a.metric, 0);
}

export default function TargetList({ targets, categories, activities }: Props) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const currentValues = useMemo(
    () => new Map(targets.map((t) => [t.id, computeCurrentValue(t, activities)])),
    [targets, activities],
  );

  const renderItem = useCallback(
    ({ item }: { item: Target }) => (
      <TargetCard
        target={item}
        category={categoryMap.get(item.categoryId)}
        currentValue={currentValues.get(item.id) ?? 0}
      />
    ),
    [categoryMap, currentValues],
  );

  return (
    <FlatList
      data={targets}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      accessibilityRole="list"
      accessibilityLabel="Targets list"
      ListEmptyComponent={emptyComponent}
    />
  );
}

const keyExtractor = (item: Target) => item.id.toString();

const emptyComponent = (
  <EmptyState title="No targets yet" message="Tap 'Add Target' to set your first goal." />
);
