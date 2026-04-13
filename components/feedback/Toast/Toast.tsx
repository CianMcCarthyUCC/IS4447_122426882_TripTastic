import { memo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
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
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const handleHide = useCallback(() => {
    onHideRef.current();
  }, []);

  useEffect(() => {
    if (visible) {
      // Slide in with spring
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      // Then slide out after duration
      translateY.value = withDelay(
        duration,
        withTiming(TOAST_HIDDEN_Y, { duration: 300 }, (finished) => {
          if (finished) runOnJS(handleHide)();
        }),
      );
    } else {
      translateY.value = TOAST_HIDDEN_Y;
    }
  }, [visible, duration, translateY, handleHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
      {variant === 'success' ? (
        <LottieView
          source={require('@/assets/animations/success-check.json')}
          autoPlay
          loop={false}
          style={styles.lottieIcon}
        />
      ) : (
        <Ionicons name={ICONS[variant]} size={20} color={Palette.white} />
      )}
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
  lottieIcon: {
    height: 24,
    width: 24,
  },
});
