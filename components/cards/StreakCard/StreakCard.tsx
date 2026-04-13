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
 * Streak card — shows consecutive days/weeks of activity for a category.
 * Rubric: "Consecutive days/weeks where targets are met"
 */
function StreakCard({ streak }: Props) {
  const theme = useAppTheme();
  const isActive = streak.currentStreak > 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.row}>
        <Text style={styles.fire}>{isActive ? '🔥' : '❄️'}</Text>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{streak.categoryName}</Text>
          <Text style={[styles.detail, { color: theme.textSecondary }]}>
            {isActive
              ? `${streak.currentStreak} ${streak.unit} streak!`
              : 'No active streak'}
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
  fire: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  detail: { fontSize: 13, marginTop: Spacing.xs },
  badge: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  best: { fontSize: 12, fontWeight: '600' },
});
