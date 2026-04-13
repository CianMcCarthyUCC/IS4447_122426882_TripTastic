import { memo } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle | (ViewStyle | false | undefined)[];
  accessibilityRole?: 'summary' | 'button' | 'link';
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Reusable animated card wrapper — spring scale on press.
 * Wrap any card content to get tactile press feedback.
 */
function AnimatedCard({ children, onPress, style, accessibilityRole = 'summary', accessibilityLabel }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}

export default memo(AnimatedCard);
