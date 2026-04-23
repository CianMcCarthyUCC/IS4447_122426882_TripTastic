import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ProgressData } from '@/utils/progressHelpers';

type Props = ProgressData & {
  current: number;
  target: number;
  unit?: string;
};

/**
 * The visual progress bar used across goals and trips. Shows the current
 * value against the target with a filled bar, a percentage and a short
 * status line underneath so the user can see how close they are.
 */
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
        <Text style={[styles.exceededText, { color: theme.successAction }]}>
          {current - target} {unit} over target
        </Text>
      )}
    </View>
  );
}

export default memo(ProgressBar);

const styles = StyleSheet.create({
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
