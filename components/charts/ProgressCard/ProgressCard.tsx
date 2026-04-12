import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InfoTag } from '@/components/tags';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { Colors, Spacing, SharedStyles } from '@/constants';
import { computeProgress } from '@/utils/progressHelpers';

type Props = {
  categoryName: string;
  categoryColor: string;
  current: number;
  target: number;
  period: string;
  percent: number;
  exceeded: boolean;
};

/**
 * Target progress card for Insights screen.
 * Uses shared ProgressBar and computeProgress for consistency.
 */
function ProgressCard({
  categoryName,
  categoryColor,
  current,
  target,
  period,
}: Props) {
  const progress = useMemo(
    () => computeProgress(current, target, categoryColor),
    [current, target, categoryColor],
  );

  return (
    <View
      style={[SharedStyles.card, progress.exceeded && styles.exceededCard]}
      accessibilityRole="summary"
      accessibilityLabel={`${categoryName} target: ${progress.percent}% complete`}
    >
      <View style={styles.header}>
        <View style={[SharedStyles.colorDot, { backgroundColor: categoryColor }]} />
        <Text style={styles.name}>{categoryName}</Text>
      </View>

      <ProgressBar {...progress} current={current} target={target} />

      <View style={styles.tags}>
        <InfoTag label="Period" value={period} />
      </View>
    </View>
  );
}

export default memo(ProgressCard);

const styles = StyleSheet.create({
  exceededCard: {
    borderColor: Colors.dangerAction,
    borderWidth: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
});
