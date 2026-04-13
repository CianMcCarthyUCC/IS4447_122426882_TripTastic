import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InfoTag } from '@/components/tags';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { Spacing, BorderRadius, Shadows, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
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

function ProgressCard({ categoryName, categoryColor, current, target, period }: Props) {
  const theme = useAppTheme();

  const progress = useMemo(
    () => computeProgress(current, target, categoryColor),
    [current, target, categoryColor],
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        progress.exceeded && { borderColor: theme.dangerAction, borderWidth: 2 },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${categoryName} target: ${progress.percent}% complete`}
    >
      <View style={styles.header}>
        <View style={[SharedStyles.colorDot, { backgroundColor: categoryColor }]} />
        <Text style={[styles.name, { color: theme.textPrimary }]}>{categoryName}</Text>
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
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
});
