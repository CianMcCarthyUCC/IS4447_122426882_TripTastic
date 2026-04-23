import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Size = 'small' | 'medium' | 'large';

type Props = {
  message?: string;
  size?: Size;
};

// Diameter of the orbit, icon glyph size, and how long one full loop takes.
// Orbit-to-icon ratio is ~3:1 - chosen so the plane is unambiguously a
// plane (you can see the nose, wings, and tail as it travels) rather than
// a dot orbiting empty space. At this ratio, the plane's body sweeps a
// meaningful arc of the curve each frame, so the motion reads as "plane
// flying a circular loop" with the tail trailing the path just flown.
// `small` stays compact enough to drop into a button; `medium` and `large`
// are sized so the loop is the centrepiece of their loading state.
const SIZE_CONFIG: Record<Size, { orbit: number; icon: number; duration: number }> = {
  small: { orbit: 40, icon: 14, duration: 1440 },
  medium: { orbit: 200, icon: 56, duration: 2800 },
  large: { orbit: 280, icon: 84, duration: 3600 },
};

// Ionicons `airplane` naturally points up-and-right (~-45° from the +x axis
// in screen coords). Adding this offset to the tangent angle keeps the
// nose aligned with the direction of motion all the way round.
const ICON_NOSE_OFFSET_DEG = 45;

/**
 * The app's on-brand loading spinner: a little plane flying a circular
 * loop, optionally paired with a Loading label. Used anywhere the user is
 * waiting on data, in three sizes for buttons, sections and full screens.
 */
function PlaneLoader({ message = 'Loading...', size = 'large' }: Props) {
  const theme = useAppTheme();
  const { orbit, icon, duration } = SIZE_CONFIG[size];
  const radius = (orbit - icon) / 2;

  // Time driver: 0 → 1 linear, infinite loop. One full loop = `duration` ms.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress, duration]);

  // Orbital position - the plane's (x, y) traces a circle of `radius` around
  // the orbit-box centre. Starts at (radius, 0) = 3 o'clock, moves clockwise.
  const positionStyle = useAnimatedStyle(() => {
    const t = progress.value * 2 * Math.PI;
    return {
      transform: [
        { translateX: radius * Math.cos(t) },
        { translateY: radius * Math.sin(t) },
      ],
    };
  });

  // Tangent rotation - purely direction-of-travel. Decoupled from position
  // so neither transform interferes with the other.
  const rotationStyle = useAnimatedStyle(() => {
    const t = progress.value * 2 * Math.PI;
    const tangentDeg = (t * 180) / Math.PI + 90 + ICON_NOSE_OFFSET_DEG;
    return {
      transform: [{ rotate: `${tangentDeg}deg` }],
    };
  });

  const showLabel =
    size === 'large' || (size === 'medium' && Boolean(message));

  return (
    <View
      style={[styles.container, size === 'small' && styles.containerSmall]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
    >
      <View style={[styles.orbitBox, { height: orbit, width: orbit }]}>
        {/* Dotted "flight path" ring - matches the radius the plane's centre
            traces, so the plane visibly hovers along it. Mimics the
            travel-map aesthetic of a plane following a dotted route. Hidden
            on `small` where dots don't render cleanly inside a button. */}
        {size !== 'small' ? (
          <View
            pointerEvents="none"
            style={[
              styles.track,
              {
                borderColor: theme.cardBorder,
                borderRadius: radius,
                height: radius * 2,
                width: radius * 2,
              },
            ]}
          />
        ) : null}

        {/* Center label - sits in the middle of the dotted ring so the plane
            circles around it (the "travel around the world / text in the
            centre" pattern). Absolute-positioned overlay so it doesn't push
            the plane's layout position off the orbit centre. */}
        {showLabel ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.centerOverlay]}
          >
            <Text
              style={[styles.centerMessage, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {message}
            </Text>
          </View>
        ) : null}

        {/* Outer view handles orbital position only (cos/sin). */}
        <Animated.View style={positionStyle}>
          {/* Inner view handles tangent rotation only. Split so each
              transform is independent and the plane clearly orbits rather
              than appearing to rotate in place. */}
          <Animated.View style={rotationStyle}>
            <Ionicons
              name="airplane"
              size={icon}
              color={theme.accentAction ?? Palette.coral}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

export default memo(PlaneLoader);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  containerSmall: {
    flexDirection: 'row',
    paddingVertical: 0,
  },
  orbitBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    borderStyle: 'dotted',
    borderWidth: 1.5,
    position: 'absolute',
  },
  centerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMessage: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
