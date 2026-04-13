import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { Spacing, BorderRadius, Shadows, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { computeProgress } from '@/utils/progressHelpers';
import type { Target, Category } from '@/types';

type Props = {
  target: Target;
  category?: Category;
  currentValue: number;
};

function TargetCard({ target, category, currentValue }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

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
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        progress.exceeded && { borderColor: theme.dangerAction, borderWidth: 2 },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Target: ${category?.name ?? 'Unknown'} — ${progress.percent}% complete`}
    >
      <View style={styles.header}>
        {category && (
          <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
        )}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {category?.name ?? 'Unknown'}
        </Text>
      </View>

      <ProgressBar {...progress} current={currentValue} target={target.targetValue} />

      <View style={styles.tags}>
        <InfoTag label="Period" value={target.period} />
        <InfoTag label="Scope" value={target.tripId ? 'This Trip' : 'All Trips'} />
      </View>

      <PrimaryButton compact label="View Details" variant="accent" onPress={openDetails} />
    </View>
  );
}

export default memo(TargetCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
});
