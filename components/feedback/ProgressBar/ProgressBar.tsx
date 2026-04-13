import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing, BorderRadius, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ProgressData } from '@/utils/progressHelpers';

type Props = ProgressData & {
  current: number;
  target: number;
  unit?: string;
};

function ProgressBar({
  current,
  target,
  percent,
  exceeded,
  met,
  remaining,
  barFillWidth,
  barColor,
  unit = 'min',
}: Props) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${current} of ${target} ${unit}, ${percent}%`}
      accessibilityValue={{ min: 0, max: target, now: current }}
    >
      {(exceeded || met) && (
        <View style={styles.badgeRow}>
          {exceeded && (
            <View style={[SharedStyles.badge, { backgroundColor: theme.dangerAction }]}>
              <Text style={SharedStyles.badgeText}>Exceeded</Text>
            </View>
          )}
          {met && (
            <View style={[SharedStyles.badge, { backgroundColor: theme.successAction }]}>
              <Text style={SharedStyles.badgeText}>Met</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.barBg, { backgroundColor: theme.cardBorder }]}>
        <View style={[styles.barFill, { width: `${barFillWidth}%`, backgroundColor: barColor }]} />
      </View>

      <Text style={[styles.text, { color: theme.textPrimary }]}>
        {current} / {target} {unit} ({percent}%)
      </Text>

      {!met && !exceeded && remaining > 0 && (
        <Text style={[styles.remaining, { color: theme.textSecondary }]}>
          {remaining} {unit} remaining
        </Text>
      )}
      {exceeded && (
        <Text style={[styles.exceededText, { color: theme.dangerAction }]}>
          {current - target} {unit} over target
        </Text>
      )}
    </View>
  );
}

export default memo(ProgressBar);

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  barBg: {
    borderRadius: BorderRadius.pill,
    height: 8,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: BorderRadius.pill,
    height: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  remaining: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  exceededText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
