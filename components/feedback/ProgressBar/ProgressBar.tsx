import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, BorderRadius, SharedStyles } from '@/constants';
import type { ProgressData } from '@/utils/progressHelpers';

type Props = ProgressData & {
  current: number;
  target: number;
  unit?: string;
};

/**
 * Reusable progress bar with percentage, status badges, and remaining display.
 * Used across TargetCard, ProgressCard, and target detail screen.
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
  return (
    <View accessibilityLabel={`${current} of ${target} ${unit}, ${percent}%`}>
      {/* Badge row */}
      {(exceeded || met) && (
        <View style={styles.badgeRow}>
          {exceeded && (
            <View style={[SharedStyles.badge, { backgroundColor: Colors.dangerAction }]}>
              <Text style={SharedStyles.badgeText}>Exceeded</Text>
            </View>
          )}
          {met && (
            <View style={[SharedStyles.badge, { backgroundColor: Colors.successAction }]}>
              <Text style={SharedStyles.badgeText}>Met</Text>
            </View>
          )}
        </View>
      )}

      {/* Bar */}
      <View style={SharedStyles.progressBarBg}>
        <View style={[SharedStyles.progressBarFill, { width: `${barFillWidth}%`, backgroundColor: barColor }]} />
      </View>

      {/* Text */}
      <Text style={styles.text}>
        {current} / {target} {unit} ({percent}%)
      </Text>

      {!met && !exceeded && remaining > 0 && (
        <Text style={styles.remaining}>{remaining} {unit} remaining</Text>
      )}
      {exceeded && (
        <Text style={styles.exceededText}>
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
  text: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  remaining: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  exceededText: {
    color: Colors.dangerAction,
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
