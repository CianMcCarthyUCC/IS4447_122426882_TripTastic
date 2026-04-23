import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
};

/**
 * A single at-a-glance metric tile. Sits in rows at the top of tab screens
 * to give the user a quick snapshot (e.g. number of trips, total minutes).
 */
function StatCard({ label, value, icon = 'stats-chart', accentColor }: Props) {
  const theme = useAppTheme();
  const color = accentColor ?? theme.accentAction;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default memo(StatCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
    height: 32,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 32,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
  },
});
