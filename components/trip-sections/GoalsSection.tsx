import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories, useSuggestionDismissal } from '@/hooks';
import { TargetList } from '@/components/lists';
import { SummaryBanner } from '@/components/cards';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { SuggestionChip } from '@/components/forms';
import { computeTargetCurrentValue, suggestTargetFilter } from '@/utils';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Activity, Target } from '@/types';

type Props = {
  activities: Activity[];
  targets: Target[];
};

const SUGGESTION_KEY = 'suggestion:goals';

type GoalsFilter = 'all' | 'in-progress';

/**
 * Goals section of the trip detail screen — progress banner + list of targets
 * with their current attainment, plus a FAB to add a new goal. Surfaces a
 * rule-based "in-progress only" suggestion chip when at least one target is
 * still below its goal so the user can zoom in on what needs attention.
 */
export function GoalsSection({ activities, targets }: Props) {
  const router = useRouter();
  const theme = useAppTheme();
  const { categories } = useCategories();
  const { isDismissed, dismiss } = useSuggestionDismissal();
  const [filter, setFilter] = useState<GoalsFilter>('all');

  // "On track" = current metric total ≥ target value for this category.
  const onTrack = useMemo(() => {
    return targets.filter((t) => computeTargetCurrentValue(t, activities) >= t.targetValue).length;
  }, [targets, activities]);

  const suggestion = useMemo(
    () => suggestTargetFilter(targets, activities),
    [targets, activities],
  );
  // Chip only appears when there's something actionable AND the user hasn't
  // already dismissed it this session AND no filter is currently applied —
  // keeps the nudge quiet once the user has engaged with it.
  const showSuggestion =
    suggestion !== null && !isDismissed(SUGGESTION_KEY) && filter === 'all';

  const handleApplySuggestion = useCallback(() => {
    if (suggestion?.apply.status === 'in-progress') setFilter('in-progress');
  }, [suggestion]);

  const visibleTargets = useMemo(() => {
    if (filter === 'all') return targets;
    return targets.filter(
      (t) => computeTargetCurrentValue(t, activities) < t.targetValue,
    );
  }, [filter, targets, activities]);

  // SummaryBanner + suggestion chip + "clear filter" row go into the
  // FlatList's header so the entire section is a single scroll surface —
  // same rationale as in ActivitiesSection. Memoized so the FlatList
  // doesn't re-render the header on unrelated state changes.
  const listHeader = useMemo(
    () => (
      <View>
        <SummaryBanner onTrack={onTrack} total={targets.length} />
        {showSuggestion && suggestion ? (
          <SuggestionChip
            label={suggestion.label}
            onApply={handleApplySuggestion}
            onDismiss={() => dismiss(SUGGESTION_KEY)}
          />
        ) : null}
        {filter !== 'all' ? (
          <Pressable
            onPress={() => setFilter('all')}
            accessibilityRole="button"
            accessibilityLabel="Show all goals"
            style={({ pressed }) => [styles.clearRow, pressed && styles.clearRowPressed]}
          >
            <Text style={[styles.clearText, { color: theme.accentAction }]}>
              Showing in-progress only · Show all
            </Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [
      onTrack,
      targets.length,
      showSuggestion,
      suggestion,
      handleApplySuggestion,
      dismiss,
      filter,
      theme.accentAction,
    ],
  );

  // Two distinct "empty" states: zero goals defined vs. filter masks all
  // in-progress goals. Both stay inside the scrollable via ListEmptyComponent
  // so the user can still drag on the header to scroll.
  const listEmpty =
    targets.length === 0 ? (
      <EmptyState
        title="No goals yet"
        message="Set targets to track your trip progress."
        actionLabel="Add Goal"
        onAction={() => router.push('/target/add')}
      />
    ) : (
      <EmptyState
        title="Nothing in progress"
        message="All your goals are on track."
        actionLabel="Show all goals"
        onAction={() => setFilter('all')}
      />
    );

  return (
    <>
      <TargetList
        targets={visibleTargets}
        categories={categories}
        activities={activities}
        listHeaderComponent={listHeader}
        listEmptyComponent={listEmpty}
      />
      <FAB onPress={() => router.push('/target/add')} icon="flag" label="Add Goal" accessibilityLabel="Add goal" />
    </>
  );
}

const styles = StyleSheet.create({
  clearRow: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  clearRowPressed: {
    opacity: 0.6,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
