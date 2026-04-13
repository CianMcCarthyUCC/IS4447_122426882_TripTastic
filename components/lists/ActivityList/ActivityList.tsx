import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { ActivityCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Activity, Category } from '@/types';

type Props = {
  activities: Activity[];
  categories: Category[];
};

export default function ActivityList({ activities, categories }: Props) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityCard activity={item} category={categoryMap.get(item.categoryId)} />
    ),
    [categoryMap],
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
