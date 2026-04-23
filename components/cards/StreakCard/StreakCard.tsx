import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { StreakInfo } from '@/utils/streakCalculator';

type Props = {
  streak: StreakInfo;
};

/**
 * A card that shows the user's streak - the run of consecutive days on
 * which every planned activity was completed. An active streak shows a
 * flame to celebrate the run; a broken streak shows a gentle nudge to
 * finish today's plan.
 */
function StreakCard({ streak }: Props) {
  const theme = useAppTheme();
  const isActive = streak.currentStreak > 0;

  return (
    <View style={[styles.card, { borderColor: theme.cardBorder }]}>
      <View style={styles.row}>
        <Ionicons
          name={isActive ? 'flame' : 'snow-outline'}
          size={26}
          color={isActive ? Palette.coral : theme.textSecondary}
          style={styles.icon}
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>Completion Streak</Text>
          <Text style={[styles.detail, { color: theme.textSecondary }]}>
            {isActive
              ? `${streak.currentStreak} ${streak.currentStreak === 1 ? 'day' : 'days'} with everything ticked off`
              : 'Finish every planned activity for a day to start a streak'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="trophy" size={14} color={Palette.gold} />
          <Text style={[styles.best, { color: theme.textSecondary }]}>Best: {streak.longestStreak}</Text>
        </View>
      </View>
    </View>
  );
}

export default memo(StreakCard);

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  icon: { width: 28 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  detail: { fontSize: 13, marginTop: Spacing.xs },
  badge: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  best: { fontSize: 12, fontWeight: '600' },
});
