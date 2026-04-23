import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { filtersPillLabel } from '@/utils';

type Props = {
  /** Number of currently-applied filters. Drives the active accent look. */
  activeCount: number;
  /** Fires when the user taps the pill. Typically opens a filter sheet. */
  onPress: () => void;
  /** Custom label prefix. Defaults to "Filters". */
  label?: string;
  accessibilityLabel?: string;
};

/**
 * The small "Filters" pill shown above a list to open the drill-down
 * filter sheet. Turns accent-coloured and shows a count badge when any
 * filter is applied, so the user can tell at a glance whether the list
 * they are looking at is narrowed.
 */
function FiltersPill({ activeCount, onPress, label = 'Filters', accessibilityLabel }: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();
  const active = activeCount > 0;
  const tint = active ? theme.accentAction : theme.textPrimary;
  const border = active ? theme.accentAction : theme.cardBorder;

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? filtersPillLabel(activeCount)}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: theme.cardBackground,
          borderColor: border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="options-outline" size={16} color={tint} />
      <Text style={[styles.label, { color: tint }]}>
        {label}
        {active ? ` \u00b7 ${activeCount}` : ''}
      </Text>
    </Pressable>
  );
}

export default memo(FiltersPill);

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    // Push the pill (and anything that comes after it in the row, like a
    // Clear chip) to the right edge so Filters always anchors to the
    // right across every screen that uses this control.
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
