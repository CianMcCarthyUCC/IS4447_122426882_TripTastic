import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

export type SuccessVariant = 'planned' | 'completed';

type Props = {
  visible: boolean;
  variant: SuccessVariant;
  message: string;
  /** Fires after the exit animation completes so callers can navigate. */
  onDone: () => void;
  /** How long the overlay sits fully on-screen before fading out. */
  holdMs?: number;
};

const HOLD_DEFAULT = 900;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Tick geometry inside a 120×120 badge - a two-segment polyline the
// stroke-draw animates along its length. Total path length pre-computed
// (28 + 52 ≈ 80) and rounded up to 90 so the dash fully covers the
// starting state; any tiny measurement drift just shows as a touch of
// extra "room" before the stroke begins, never a sliver of pre-drawn tick.
const TICK_PATH = 'M30 64 L54 88 L94 36';
const TICK_LENGTH = 90;

/**
 * The full-screen celebratory overlay shown after the user saves an
 * activity. Shows either a drawn-in tick (completed) or a calendar glyph
 * (planned), holds for a moment, then fades away.
 */
function SuccessOverlay({
  visible,
  variant,
  message,
  onDone,
  holdMs = HOLD_DEFAULT,
}: Props) {
  const theme = useAppTheme();
  const scrim = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const iconScale = useSharedValue(0);
  // 0 → 1 progress for the checkmark's stroke-draw. Kept separate from
  // `iconScale` so the completed variant can draw while the planned
  // variant's calendar just pops.
  const tickProgress = useSharedValue(0);

  // Latest-onDone ref - the animation's JS-thread callback fires after
  // the overlay's props may have changed, so we always want the freshest
  // handler (not one captured at effect-run time).
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    onDoneRef.current();
  };

  useEffect(() => {
    if (!visible) {
      scrim.value = 0;
      badgeScale.value = 0;
      iconScale.value = 0;
      tickProgress.value = 0;
      return;
    }

    // Scrim fades in, badge pops with overshoot, icon/tick animates a
    // beat after so the landing moment reads as distinct from the badge
    // itself materialising.
    scrim.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
    badgeScale.value = withSpring(1, { damping: 10, stiffness: 180 });

    if (variant === 'completed') {
      tickProgress.value = withDelay(
        140,
        withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      iconScale.value = withDelay(
        120,
        withSpring(1, { damping: 8, stiffness: 220 }),
      );
    }

    scrim.value = withDelay(
      holdMs,
      withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
    badgeScale.value = withDelay(
      holdMs,
      withTiming(0.6, { duration: 220, easing: Easing.in(Easing.cubic) }),
    );
  }, [visible, holdMs, scrim, badgeScale, iconScale, tickProgress, variant]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  // Animate the dash offset so the stroke draws from start → end. At
  // progress=0 the offset equals the full length (dash sits entirely
  // "off" the visible path); at progress=1 it's 0 (dash fully drawn).
  const tickAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: TICK_LENGTH * (1 - tickProgress.value),
  }));

  if (!visible) return null;

  const accent = variant === 'completed' ? Palette.coral : Palette.info;

  return (
    <Animated.View
      // `pointerEvents="none"` - the overlay is purely celebratory, we
      // never want it to eat a tap the user might make on the form as
      // it animates out.
      pointerEvents="none"
      style={[
        styles.root,
        { backgroundColor: theme.overlay },
        scrimStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Animated.View style={[styles.badge, { backgroundColor: accent }, badgeStyle]}>
        {variant === 'completed' ? (
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <AnimatedPath
              d={TICK_PATH}
              stroke={Palette.white}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={TICK_LENGTH}
              animatedProps={tickAnimatedProps}
            />
          </Svg>
        ) : (
          <Animated.View style={iconStyle}>
            <Ionicons name="calendar" size={56} color={Palette.white} />
          </Animated.View>
        )}
      </Animated.View>
      <View style={[styles.messageCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.message, { color: theme.textPrimary }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export default memo(SuccessOverlay);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10001,
  },
  badge: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 120,
    justifyContent: 'center',
    width: 120,
    ...Shadows.lg,
  },
  messageCard: {
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    ...Shadows.md,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
  },
});
