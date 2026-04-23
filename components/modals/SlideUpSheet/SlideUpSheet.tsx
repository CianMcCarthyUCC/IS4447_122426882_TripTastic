import { useContext, useEffect } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing } from '@/constants';
import { useAppTheme, ThemeContext } from '@/hooks/useAppTheme';
import type { ReactNode } from 'react';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Leave a clear ~30% peek of the previous screen at the top so the user
// still sees the context they came from, slightly blurred behind the
// backdrop. Shorter than the iOS default so the underlying screen reads
// at a glance, not just as a sliver.
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.7);
// Max upward shift when the keyboard appears - never exceed the empty
// space above the sheet so the header never scrolls off-screen.
const MAX_KEYBOARD_SHIFT = SCREEN_HEIGHT - SHEET_HEIGHT;
// Drag further than this and we commit to the dismiss animation.
const DISMISS_THRESHOLD = 120;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type Props = {
  /** Short heading shown in the sheet header, e.g. "Log Activity". */
  title: string;
  /** Optional subtitle - one short sentence under the title. */
  subtitle?: string;
  /** Fired when the user taps the backdrop, drags past the threshold, or taps the close button. */
  onClose: () => void;
  children: ReactNode;
};

/**
 * The bottom sheet used for the app's add-new flows (add trip, add
 * activity, add goal). Slides up from the bottom over a blurred
 * backdrop, and can be swiped down to dismiss so the user always has a
 * quick way back.
 */
export default function SlideUpSheet({
  title,
  subtitle,
  onClose,
  children,
}: Props) {
  const theme = useAppTheme();
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDark ?? false;
  // 0 = fully open (sheet at rest position), SHEET_HEIGHT = fully closed.
  const translateY = useSharedValue(SHEET_HEIGHT);
  // Offset applied on top of translateY so the sheet slides up when the
  // keyboard opens, keeping focused fields visible. Clamped so the top
  // of the sheet never leaves the viewport.
  const keyboardShift = useSharedValue(0);

  // Slide up on mount - heavy-feel spring so the sheet settles without
  // a visible bounce. Parameters picked to approximate iOS's native
  // `.pageSheet` timing curve.
  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 28,
      stiffness: 180,
      mass: 1,
      overshootClamping: true,
    });
  }, [translateY]);

  const close = () => {
    // Animate down first, then invoke onClose once off-screen - keeps
    // the exit visually smooth instead of popping the route instantly.
    translateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 240, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  };

  // Track the on-screen keyboard so the sheet can slide up enough to
  // keep the focused input visible. iOS exposes *Will* events for a
  // smooth animated follow; Android only has *Did*.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      const h = e.endCoordinates?.height ?? 0;
      keyboardShift.value = withTiming(-Math.min(h, MAX_KEYBOARD_SHIFT), {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardShift.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardShift]);

  // Intercept Android hardware back - we want the same animated close
  // path the user sees from the backdrop/close-button, not an instant
  // route pop with no exit animation.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // `close` is a fresh closure each render but reads shared values,
    // not React state, so it's safe to leave off the deps here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow dragging downward - upward drag is a no-op so the
      // sheet doesn't float above its rest position.
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(
          SHEET_HEIGHT,
          { duration: 200, easing: Easing.in(Easing.cubic) },
          (finished) => { if (finished) runOnJS(onClose)(); },
        );
      } else {
        translateY.value = withSpring(0, {
          damping: 28,
          stiffness: 200,
          mass: 1,
          overshootClamping: true,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardShift.value }],
  }));

  // Backdrop opacity tracks the sheet - full at rest, zero when fully
  // closed so it fades out as the sheet falls away.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SHEET_HEIGHT], [1, 0]),
  }));

  // Blur tint matches the active theme so the peek of the underlying
  // screen still reads correctly in both modes.
  const blurTint = isDark ? 'dark' : 'light';

  return (
    <GestureHandlerRootView style={styles.root}>
        {/* Blurred backdrop - tapping dismisses. The blur lets the
            previous route peek through with just enough softening that
            it fades into context rather than competing with the sheet.
            `experimentalBlurMethod="dimezisBlurView"` enables a real
            native blur on Android (default Android returns a no-op
            translucent view). The fallback `backgroundColor` dims the
            peek if blur is unavailable on this OS/build so users still
            get visual separation. */}
        <AnimatedBlurView
          intensity={60}
          tint={blurTint}
          experimentalBlurMethod="dimezisBlurView"
          style={[
            styles.backdrop,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)' },
            backdropStyle,
          ]}
          pointerEvents="auto"
        >
          <Pressable
            style={styles.backdropPress}
            onPress={close}
            accessibilityLabel="Dismiss sheet"
          />
        </AnimatedBlurView>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.screenBackground },
            sheetStyle,
          ]}
        >
          {/* Drag affordance - the grabber at the top is part of the
              pan-gesture area so users can flick to dismiss. */}
          <GestureDetector gesture={pan}>
            <View style={styles.grabberArea}>
              <View style={[styles.grabber, { backgroundColor: theme.textSecondary }]} />
            </View>
          </GestureDetector>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={close}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.tagBackground },
                pressed && styles.closePressed,
              ]}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>

          <SafeAreaView edges={['bottom']} style={styles.body}>
            {children}
          </SafeAreaView>
        </Animated.View>
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    bottom: 0,
    height: SHEET_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    // Soft drop shadow at the top edge so the sheet visually lifts off
    // the blurred backdrop instead of merging into it.
    ...Shadows.lg,
  },
  grabberArea: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.md,
  },
  grabber: {
    borderRadius: 3,
    height: 5,
    opacity: 0.35,
    width: 44,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  closeBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closePressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
});
