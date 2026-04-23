import { StyleSheet, View } from 'react-native';
import { DarkTheme, Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

/**
 * The soft, faded circles that sit behind the content on many screens.
 * Purely decorative - they add a bit of visual warmth without getting
 * in the way, and are hidden from screen readers.
 */
type Props = {
  /** Override the default theme-aware opacity. */
  opacity?: number;
  /** Override just the bottom-right circle's opacity (defaults to `opacity`). */
  bottomRightOpacity?: number;
};

export default function DecorativeCircles({
  opacity: opacityProp,
  bottomRightOpacity,
}: Props = {}) {
  const theme = useAppTheme();
  const isDark = theme === DarkTheme;
  const opacity = opacityProp ?? (isDark ? 0.09 : 0.18);
  const brOpacity = bottomRightOpacity ?? opacity;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.wrapper}
    >
      <View
        style={[
          styles.circle,
          styles.topLeft,
          { backgroundColor: Palette.coral, opacity },
        ]}
      />
      <View
        style={[
          styles.circle,
          styles.bottomRight,
          { backgroundColor: Palette.coral, opacity: brOpacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    top: -Spacing.xxl,
    left: -Spacing.xxl,
    right: -Spacing.xxl,
    bottom: -Spacing.xxl,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  topLeft: {
    width: 300,
    height: 300,
    top: -100,
    left: -100,
  },
  bottomRight: {
    width: 300,
    height: 300,
    bottom: -100,
    right: -100,
  },
});
