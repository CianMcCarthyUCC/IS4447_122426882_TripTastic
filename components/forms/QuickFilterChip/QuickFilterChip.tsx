import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  /**
   * `sm` (default) - the compact chip used inline alongside other filter
   * chips. `md` - a slightly taller chip with a bigger label and icon,
   * used when the chip is a primary filter (e.g. the All / Planned /
   * Completed status row on the Activities tab).
   */
  size?: 'sm' | 'md';
  /**
   * When true, the chip expands to fill the available width in its row.
   * Used on rows where every chip should take up an even share of space.
   */
  fill?: boolean;
};

/**
 * A small outlined pill for inline quick filters such as the favourites
 * toggle or the sort-direction flip. Matches the look of the main filter
 * chips so every filter in the app reads as one system.
 */
function QuickFilterChipInner({
  label,
  active,
  onPress,
  icon,
  accessibilityLabel,
  size = 'sm',
  fill = false,
}: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();
  const tint = active ? theme.accentAction : theme.textPrimary;
  const border = active ? theme.accentAction : theme.cardBorder;
  const isMedium = size === 'md';
  return (
    <Pressable
      onPress={() => { haptics.light(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        isMedium && styles.chipMedium,
        fill && styles.chipFill,
        { backgroundColor: theme.cardBackground, borderColor: border },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={isMedium ? 16 : 14} color={tint} /> : null}
      <Text
        style={[styles.label, isMedium && styles.labelMedium, { color: tint }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const QuickFilterChip = memo(QuickFilterChipInner);

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipMedium: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
  },
  chipFill: {
    // When a chip is asked to fill its row share, it stretches to take
    // the full width of its parent wrapper (which is given an explicit
    // flex trio at the call site). `minWidth: 0` here lets the chip
    // shrink below its content's intrinsic width so the label truncates
    // cleanly instead of pushing the chip off-screen.
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 0,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelMedium: {
    fontSize: 15,
  },
});
