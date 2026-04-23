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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type ToastVariant = 'success' | 'error' | 'info' | 'accent';
type ToastPosition = 'top' | 'bottom';

type Props = {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  onHide: () => void;
};

const TOAST_HIDDEN_OFFSET = 120;
const TOAST_DEFAULT_DURATION = 1200;

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  accent: 'heart',
};

/**
 * The short-lived pop-up message shown after an action completes (saved,
 * deleted, added to favourites). Slides in from the top or bottom of the
 * screen and fades itself out after a moment.
 */
function Toast({
  visible,
  message,
  variant = 'success',
  duration = TOAST_DEFAULT_DURATION,
  position = 'bottom',
  onHide,
}: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const hiddenY = position === 'bottom' ? TOAST_HIDDEN_OFFSET : -TOAST_HIDDEN_OFFSET;
  const translateY = useSharedValue(hiddenY);
  // Icon scale-in spring - replaces the former one-shot Lottie checkmark on
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
      translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
      iconScale.value = 0;
      iconScale.value = withSpring(1, { damping: 10, stiffness: 320 });
      translateY.value = withDelay(
        duration,
        withTiming(hiddenY, { duration: 150 }, (finished) => {
          if (finished) runOnJS(handleHide)();
        }),
      );
    } else {
      translateY.value = hiddenY;
      iconScale.value = 0;
    }
  }, [visible, duration, translateY, iconScale, handleHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const isTikTokStyle = variant === 'accent';

  const bgColor = isTikTokStyle
    ? 'rgba(30,30,30,0.82)'
    : {
        success: theme.successAction,
        error: theme.dangerAction,
        info: theme.primaryAction,
        accent: theme.accentAction,
      }[variant];

  // TikTok-style toast sits above the tab bar (~64pt bar + safe area) rather
  // than flush to the bottom edge, so it doesn't collide with nav controls.
  const bottomOffset = isTikTokStyle
    ? insets.bottom + 120
    : insets.bottom + Spacing.sm;

  const positionStyle =
    position === 'bottom'
      ? { bottom: bottomOffset }
      : { top: insets.top + Spacing.sm };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        isTikTokStyle && styles.containerTikTok,
        { backgroundColor: bgColor },
        positionStyle,
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      {isTikTokStyle ? (
        <Animated.View style={styles.iconBadge}>
          <Ionicons name="star" size={14} color={Palette.grey900} />
        </Animated.View>
      ) : (
        <Animated.View style={iconStyle}>
          <Ionicons name={ICONS[variant]} size={22} color={Palette.white} />
        </Animated.View>
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
    zIndex: 9999,
  },
  containerTikTok: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  text: {
    color: Palette.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
