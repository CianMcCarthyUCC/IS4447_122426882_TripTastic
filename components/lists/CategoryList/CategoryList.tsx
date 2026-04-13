import { useCallback } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CategoryCard } from '@/components/cards';
import { SwipeableRow } from '@/components/feedback/SwipeableRow';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Category } from '@/types';

type Props = {
  categories: Category[];
};

export default function CategoryList({ categories }: Props) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item, index }: { item: Category; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
        <SwipeableRow
          onEdit={() => router.push({ pathname: '/category/[id]/edit', params: { id: item.id.toString() } })}
        >
          <CategoryCard category={item} />
        </SwipeableRow>
      </Animated.View>
    ),
    [router],
  );

  return (
    <FlatList
      data={categories}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      accessibilityRole="list"
      accessibilityLabel="Categories list"
      ListEmptyComponent={emptyComponent}
    />
  );
}

const keyExtractor = (item: Category) => item.id.toString();

const emptyComponent = (
  <EmptyState
    title="No categories yet"
    message="Categories help you organise activities by type (e.g. Food, Sightseeing). Tap + to create one."
  />
);
