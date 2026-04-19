import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { StreakInfo } from '@/utils/streakCalculator';

type Props = {
  streak: StreakInfo;
};

/**
 * Streak card — shows the global daily activity streak.
 * Rubric: "Consecutive days where targets are met" — the implicit target is
 * logging at least one activity per day. A live streak shows the flame;
 * a broken one reads as a nudge to start logging again today.
 */
function StreakCard({ streak }: Props) {
  const theme = useAppTheme();
  const isActive = streak.currentStreak > 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.row}>
        <Ionicons
          name={isActive ? 'flame' : 'snow-outline'}
          size={26}
          color={isActive ? Palette.coral : theme.textSecondary}
          style={styles.icon}
        />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>Daily Streak</Text>
          <Text style={[styles.detail, { color: theme.textSecondary }]}>
            {isActive
              ? `${streak.currentStreak} ${streak.currentStreak === 1 ? 'day' : 'days'} in a row`
              : 'Log an activity today to start a new streak'}
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
  card: { borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm, padding: Spacing.md, ...Shadows.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  icon: { width: 28 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  detail: { fontSize: 13, marginTop: Spacing.xs },
  badge: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  best: { fontSize: 12, fontWeight: '600' },
});
