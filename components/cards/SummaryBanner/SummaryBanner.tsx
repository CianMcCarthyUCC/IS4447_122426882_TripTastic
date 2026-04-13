import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  onTrack: number;
  total: number;
};

/**
 * Summary banner for Targets tab — "X of Y targets on track".
 * Colour-coded: green when all met, coral when some pending, red when behind.
 */
function SummaryBanner({ onTrack, total }: Props) {
  const theme = useAppTheme();

  if (total === 0) return null;

  const ratio = onTrack / total;
  const color = ratio >= 1 ? theme.successAction : ratio >= 0.5 ? Palette.coral : theme.dangerAction;
  const icon: keyof typeof Ionicons.glyphMap = ratio >= 1 ? 'checkmark-circle' : ratio >= 0.5 ? 'trending-up' : 'alert-circle';
  const message = ratio >= 1
    ? 'All targets on track!'
    : `${onTrack} of ${total} targets on track`;

  return (
    <View style={[styles.banner, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <Ionicons name={icon} size={22} color={color} />
      <View style={styles.textContainer}>
        <Text style={[styles.message, { color: theme.textPrimary }]}>{message}</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          {total - onTrack > 0 ? `${total - onTrack} need attention` : 'Keep it up!'}
        </Text>
      </View>
    </View>
  );
}

export default memo(SummaryBanner);

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
  },
  sub: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
});
