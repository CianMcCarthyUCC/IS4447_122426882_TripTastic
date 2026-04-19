import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { Activity, Category } from '@/types';

type Props = {
  /** Zero-based position in the recommended order. */
  index: number;
  /** Total number of ordered rows — powers "Step N of M" a11y labels. */
  total: number;
  activity: Activity;
  /** Category for coloured dot + label suffix; may be null on orphan FK. */
  category: Category | null;
};

/**
 * One row of the recommended-order list inside the AI travel-guide card.
 * Extracted + memoised so taps or re-renders triggered by sibling state
 * (rationale appearing, error banner toggling) don't force every row to
 * re-render — the card can grow to 10–15 rows on long trips.
 *
 * VoiceOver narration reads as "Step 2 of 5, Colosseum tour, 180 minutes,
 * Sightseeing, 2 July 2026". Order is deliberate: position first so the
 * user knows where they are in the list before hearing the activity.
 */
function OrderedStepRowImpl({ index, total, activity, category }: Props) {
  const theme = useAppTheme();
  const label = activity.notes?.trim() || category?.name || `Activity ${activity.id}`;
  const a11yLabel = [
    `Step ${index + 1} of ${total}`,
    label,
    `${activity.metric} minutes`,
    category ? category.name : null,
    formatIsoDate(activity.date),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[styles.orderRow, { borderColor: theme.cardBorder }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <View style={[styles.rank, { backgroundColor: Palette.aiViolet }]}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={styles.orderBody}>
        <Text
          style={[styles.orderLabel, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={[styles.orderMeta, { color: theme.textSecondary }]}>
          {formatIsoDate(activity.date)} · {activity.metric}m
          {category ? ` · ${category.name}` : ''}
        </Text>
      </View>
      {category ? (
        <View
          style={[styles.dot, { backgroundColor: category.color }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </View>
  );
}

export const OrderedStepRow = memo(OrderedStepRowImpl);

const styles = StyleSheet.create({
  orderRow: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rank: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  rankText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  orderBody: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  dot: {
    borderRadius: BorderRadius.pill,
    height: 10,
    width: 10,
  },
});
