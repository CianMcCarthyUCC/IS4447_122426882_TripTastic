import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { CategoryCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import type { Category } from '@/types';

type Props = {
  categories: Category[];
};

export default function CategoryList({ categories }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: Category }) => <CategoryCard category={item} />,
    [],
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
  <EmptyState title="No categories yet" message="Tap 'Add Category' to get started." />
);
