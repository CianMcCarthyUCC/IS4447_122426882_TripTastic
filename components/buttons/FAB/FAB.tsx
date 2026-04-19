import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Shadows, Spacing, BorderRadius } from '@/constants';

type Props = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Optional label. When present the FAB renders as an extended pill
   * (icon + text) so the CTA reads at a glance; when omitted it falls
   * back to the classic 60×60 circle for backwards-compat with any caller
   * that doesn't care to label itself.
   */
  label?: string;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Floating Action Button — coral CTA at bottom-right.
 * Spring-animated scale on press. Used for primary actions on tab screens.
 */
function FAB({ onPress, icon = 'add', label, accessibilityLabel }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const isExtended = typeof label === 'string' && label.length > 0;

  // Lift above the home indicator / tab bar safe area. Fall back to the
  // previous fixed offset when the inset is zero (Android without gestures).
  const bottomOffset = Math.max(insets.bottom + Spacing.sm, 24);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  // Prefer the explicit accessibilityLabel, otherwise fall back to the
  // visible label, otherwise the generic "Add new".
  const a11yLabel = accessibilityLabel ?? label ?? 'Add new';

  return (
    <AnimatedPressable
      style={[
        isExtended ? styles.pill : styles.circle,
        { bottom: bottomOffset },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Ionicons name={icon} size={isExtended ? 22 : 28} color={Palette.white} />
      {isExtended ? <Text style={styles.label}>{label}</Text> : null}
    </AnimatedPressable>
  );
}

export default memo(FAB);

const baseFab = {
  alignItems: 'center' as const,
  backgroundColor: Palette.coral,
  justifyContent: 'center' as const,
  position: 'absolute' as const,
  right: 20,
  zIndex: 100,
  ...Shadows.lg,
};

const styles = StyleSheet.create({
  circle: {
    ...baseFab,
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  pill: {
    ...baseFab,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.sm,
    // Slightly tighter vertical than a "round" button so the pill keeps
    // the same visual weight as the old circle without getting chunky.
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  label: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
