import { memo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type ToastVariant = 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide: () => void;
};

const TOAST_HIDDEN_Y = -120;
const TOAST_DEFAULT_DURATION = 2500;

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

/**
 * Toast notification — uses Reanimated for smooth spring animations.
 * Slides in from top with spring physics, auto-hides with timing.
 */
function Toast({
  visible,
  message,
  variant = 'success',
  duration = TOAST_DEFAULT_DURATION,
  onHide,
}: Props) {
  const theme = useAppTheme();
  const translateY = useSharedValue(TOAST_HIDDEN_Y);
  // Icon scale-in spring — replaces the former one-shot Lottie checkmark on
  // the success variant with a tactile pop. Reset to 0 each time `visible`
  // flips true so the pop re-plays on every new toast.
  const iconScale = useSharedValue(0);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const handleHide = useCallback(() => {
    onHideRef.current();
  }, []);

  useEffect(() => {
    if (visible) {
      // Slide in with spring
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      // Pop the icon in with a slight overshoot — tactile, matches the
      // attention-grabbing feel of the previous Lottie animation.
      iconScale.value = 0;
      iconScale.value = withSpring(1, { damping: 9, stiffness: 180 });
      // Then slide out after duration
      translateY.value = withDelay(
        duration,
        withTiming(TOAST_HIDDEN_Y, { duration: 300 }, (finished) => {
          if (finished) runOnJS(handleHide)();
        }),
      );
    } else {
      translateY.value = TOAST_HIDDEN_Y;
      iconScale.value = 0;
    }
  }, [visible, duration, translateY, iconScale, handleHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const bgColor = {
    success: theme.successAction,
    error: theme.dangerAction,
    info: theme.primaryAction,
  }[variant];

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bgColor }, animatedStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={ICONS[variant]} size={22} color={Palette.white} />
      </Animated.View>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export default memo(Toast);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    left: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    position: 'absolute',
    right: Spacing.xl,
    top: 60,
    zIndex: 9999,
  },
  text: {
    color: Palette.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
