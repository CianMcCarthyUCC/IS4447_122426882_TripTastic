import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Shadows } from '@/constants';

type Props = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Floating Action Button — coral circle at bottom-right.
 * Spring-animated scale on press. Used for primary actions on tab screens.
 */
function FAB({ onPress, icon = 'add', accessibilityLabel = 'Add new' }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  return (
    <AnimatedPressable
      style={[styles.fab, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={28} color={Palette.white} />
    </AnimatedPressable>
  );
}

export default memo(FAB);

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: Palette.coral,
    borderRadius: 30,
    bottom: 24,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    width: 60,
    zIndex: 100,
    ...Shadows.lg,
  },
});
