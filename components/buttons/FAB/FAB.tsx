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
   * Optional caption shown next to the icon. When supplied the FAB becomes
   * a labelled pill, otherwise it stays as the classic round icon button.
   */
  label?: string;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The coral floating action button that sits in the bottom-right of the
 * tab screens. Used for the main action on each page, such as adding a
 * new trip or activity.
 */
function FAB({ onPress, icon = 'add', label, accessibilityLabel }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const isExtended = typeof label === 'string' && label.length > 0;

  // Keeps the button clear of the home indicator and tab bar on every device.
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

  // Pick the best label for screen readers.
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
    // Keeps the pill visually compact, matching the feel of the circle variant.
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
