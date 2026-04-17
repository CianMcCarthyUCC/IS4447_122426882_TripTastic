import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { TargetCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import { useCategoryLookup } from '@/hooks';
import { computeTargetCurrentValue } from '@/utils/progressHelpers';
import type { Target, Category, Activity } from '@/types';

type Props = {
  targets: Target[];
  categories: Category[];
  activities: Activity[];
};

export default function TargetList({ targets, categories, activities }: Props) {
  const categoryMap = useCategoryLookup(categories);

  const currentValues = useMemo(
    () => new Map(targets.map((t) => [t.id, computeTargetCurrentValue(t, activities)])),
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
      accessibilityLabel="Goals list"
      ListEmptyComponent={emptyComponent}
    />
  );
}

const keyExtractor = (item: Target) => item.id.toString();

const emptyComponent = (
  <EmptyState
    title="No goals yet"
    message="Goals let you set weekly or monthly targets — like '300 min of sightseeing per week'. Tap + to set your first goal!"
  />
);
