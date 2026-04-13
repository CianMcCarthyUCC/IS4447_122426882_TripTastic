import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { TargetCard } from '@/components/cards';
import { SwipeableRow } from '@/components/feedback/SwipeableRow';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Target, Category, Activity } from '@/types';

type Props = {
  targets: Target[];
  categories: Category[];
  activities: Activity[];
};

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
  const router = useRouter();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const currentValues = useMemo(
    () => new Map(targets.map((t) => [t.id, computeCurrentValue(t, activities)])),
    [targets, activities],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Target; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
        <SwipeableRow
          onEdit={() => router.push({ pathname: '/target/[id]/edit', params: { id: item.id.toString() } })}
        >
          <TargetCard
            target={item}
            category={categoryMap.get(item.categoryId)}
            currentValue={currentValues.get(item.id) ?? 0}
          />
        </SwipeableRow>
      </Animated.View>
    ),
    [categoryMap, currentValues, router],
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
  <EmptyState
    title="No goals yet"
    message="Goals let you set weekly or monthly targets — like '300 min of sightseeing per week'. Tap + to set your first goal!"
  />
);
