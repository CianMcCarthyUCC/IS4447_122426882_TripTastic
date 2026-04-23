import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { StatCard } from '@/components/cards/StatCard';
import { Spacing } from '@/constants';

type Stat = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
};

type Props = {
  stats: Stat[];
};

/**
 * A side-by-side row of stat cards. Lines them up with even spacing so each
 * screen displaying summary numbers looks consistent.
 */
function StatsRow({ stats }: Props) {
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <View key={stat.label} style={[styles.item, i > 0 && styles.gap]}>
          <StatCard
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accentColor={stat.accentColor}
          />
        </View>
      ))}
    </View>
  );
}

export default memo(StatsRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  item: {
    flex: 1,
  },
  gap: {
    marginLeft: Spacing.sm,
  },
});
