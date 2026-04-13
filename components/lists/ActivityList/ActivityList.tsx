import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ActivityCard } from '@/components/cards';
import { SwipeableRow } from '@/components/feedback/SwipeableRow';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Activity, Category } from '@/types';

type Props = {
  activities: Activity[];
  categories: Category[];
};

export default function ActivityList({ activities, categories }: Props) {
  const router = useRouter();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Activity; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
        <SwipeableRow
          onEdit={() => router.push({ pathname: '/activity/[id]/edit', params: { id: item.id.toString() } })}
        >
          <ActivityCard activity={item} category={categoryMap.get(item.categoryId)} />
        </SwipeableRow>
      </Animated.View>
    ),
    [categoryMap, router],
  );

  return (
    <FlatList
      data={activities}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      accessibilityRole="list"
      accessibilityLabel="Activities list"
      ListEmptyComponent={emptyComponent}
    />
  );
}

const keyExtractor = (item: Activity) => item.id.toString();

const emptyComponent = (
  <EmptyState
    title="No activities yet"
    message="Activities are things you do on your trips — sightseeing, dining, transport. Tap + to log your first one!"
  />
);
