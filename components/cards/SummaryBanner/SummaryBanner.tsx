import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  /** Number of goals currently hitting or exceeding their target. */
  onTrack: number;
  /** Total number of goals. */
  total: number;
};

/**
 * The three-number overview strip on the Goals tab. Gives the user a quick
 * read on how many goals they've set, how many are complete and how many
 * are still in progress.
 */
function SummaryBanner({ onTrack, total }: Props) {
  const theme = useAppTheme();

  if (total === 0) return null;

  const inProgress = Math.max(0, total - onTrack);

  return (
    <View style={[styles.row, { borderColor: theme.cardBorder }]}>
      <Stat label="Goals set" value={total} color={theme.textPrimary} />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <Stat label="Completed" value={onTrack} color={theme.successAction} />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <Stat label="In progress" value={inProgress} color={theme.accentAction} />
    </View>
  );
}

type StatProps = { label: string; value: number; color: string };

function Stat({ label, value, color }: StatProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default memo(SummaryBanner);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    height: 28,
    width: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
