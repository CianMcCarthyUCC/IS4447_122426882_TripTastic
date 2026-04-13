import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  tagline?: string;
};

/**
 * Animated branded hero for auth screens.
 * Plane SVG springs in with rotation, text fades in staggered.
 */
export default function AuthHero({ tagline = 'Plan your perfect holiday' }: Props) {
  const theme = useAppTheme();
  const planeScale = useSharedValue(0);
  const planeRotate = useSharedValue(-45);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    planeScale.value = withSpring(1, { damping: 10, stiffness: 80 });
    planeRotate.value = withSequence(
      withSpring(10, { damping: 8 }),
      withSpring(0, { damping: 12 }),
    );
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, [planeScale, planeRotate, titleOpacity, taglineOpacity]);

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: planeScale.value },
      { rotate: `${planeRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.hero} accessibilityRole="header">
      <Animated.View style={planeStyle}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill={Palette.coral}
          />
        </Svg>
      </Animated.View>

      <Animated.Text style={[styles.appName, titleStyle]}>
        Trip<Text style={styles.accent}>Tastic</Text>
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { color: theme.textSecondary }, taglineStyle]}>
        {tagline}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.xxxl,
  },
  appName: {
    color: Palette.navy,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: Spacing.md,
  },
  accent: {
    color: Palette.coral,
  },
  tagline: {
    fontSize: 16,
    marginTop: Spacing.sm,
  },
});
