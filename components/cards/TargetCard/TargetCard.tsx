import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { Colors, Spacing, SharedStyles } from '@/constants';
import { computeProgress } from '@/utils/progressHelpers';
import type { Target, Category } from '@/types';

type Props = {
  target: Target;
  category?: Category;
  currentValue: number;
};

/**
 * Target card with reusable ProgressBar + exceeded/unmet indicators.
 */
function TargetCard({ target, category, currentValue }: Props) {
  const router = useRouter();

  const openDetails = useCallback(
    () => router.push({ pathname: '/target/[id]', params: { id: target.id.toString() } }),
    [router, target.id],
  );

  const progress = useMemo(
    () => computeProgress(currentValue, target.targetValue, category?.color),
    [currentValue, target.targetValue, category?.color],
  );

  return (
    <View
      style={[SharedStyles.card, progress.exceeded && styles.exceededCard]}
      accessibilityRole="summary"
      accessibilityLabel={`Target: ${category?.name ?? 'Unknown'} — ${progress.percent}% complete`}
    >
      <Pressable onPress={openDetails} accessibilityRole="link" accessibilityHint="View target details">
        <View style={styles.header}>
          {category && (
            <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
          )}
          <Text style={styles.title}>{category?.name ?? 'Unknown'}</Text>
        </View>
      </Pressable>

      <ProgressBar
        {...progress}
        current={currentValue}
        target={target.targetValue}
      />

      <View style={styles.tags}>
        <InfoTag label="Period" value={target.period} />
        <InfoTag label="Scope" value={target.tripId ? 'Per Trip' : 'Global'} />
      </View>

      <PrimaryButton compact label="View Details" onPress={openDetails} />
    </View>
  );
}

export default memo(TargetCard);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  exceededCard: {
    borderColor: Colors.dangerAction,
    borderWidth: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
});
