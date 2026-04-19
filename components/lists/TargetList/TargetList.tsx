import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
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
   * Rendered as the first row of the scrollable surface — see the
   * matching prop on `ActivityList`. Put SummaryBanner / suggestion
   * chip / filter clear-row here so the whole goals section scrolls
   * as one gesture surface.
   */
  listHeaderComponent?: ReactElement | null;
  /**
   * Override the default "No goals yet" empty state — e.g. swap in a
   * "Nothing in progress" message when the list is empty because of an
   * active filter rather than zero data.
   */
  listEmptyComponent?: ReactElement | null;
};

export default function TargetList({
  targets,
  categories,
  activities,
  listHeaderComponent,
  listEmptyComponent,
}: Props) {
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
      // Keep parity with ActivityList — dragging dismisses any open
      // keyboard (e.g. if a sibling search input elsewhere is focused).
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      accessibilityRole="list"
      accessibilityLabel="Goals list"
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={listEmptyComponent ?? defaultEmptyComponent}
    />
  );
}

const keyExtractor = (item: Target) => item.id.toString();

const defaultEmptyComponent = (
  <EmptyState
    title="No goals yet"
    message="Goals let you set weekly or monthly targets — like '300 min of sightseeing per week'. Tap + to set your first goal!"
  />
);
