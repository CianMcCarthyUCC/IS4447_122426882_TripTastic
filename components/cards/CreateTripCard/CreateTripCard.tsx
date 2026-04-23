import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme, useThemeControl } from '@/hooks/useAppTheme';

const LOGO_LIGHT = require('@/assets/images/logo/transparent-logo-light.png');
const LOGO_DARK = require('@/assets/images/logo/transparent-logo-dark.png');

type Props = {
  onPress: () => void;
  /** Matches the width TripCard receives in the same carousel. */
  width?: number;
  /** Override the headline. Defaults to "Create Trip". */
  title?: string;
  /** Override the helper line under the headline. */
  helper?: string;
  /** Accessibility label override; defaults to "Create a new trip". */
  accessibilityLabel?: string;
};

/**
 * The "create a new trip" placeholder card. Sits at the head of the Trips
 * carousel and as the empty state on the Profile screen, inviting the user
 * to plan their next trip. Sized to match the regular trip cards so the
 * rail reads as one consistent carousel.
 */
function CreateTripCard({
  onPress,
  width,
  title = 'Create Trip',
  helper = 'Tap to plan your next adventure',
  accessibilityLabel = 'Create a new trip',
}: Props) {
  const theme = useAppTheme();
  const { isDark } = useThemeControl();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground },
        width !== undefined && { width },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens the new trip form"
    >
      {({ pressed }) => (
        <>
      {/* Soft grey gradient base - theme-aware so it reads muted in both
          light and dark modes without a hardcoded colour. */}
      <LinearGradient
        colors={[theme.tagBackground, theme.cardBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Background silhouette - large and very low opacity so it hints
          at "travel" without competing with the centre content. Marked
          non-interactive for screen readers. */}
      <View
        style={styles.silhouette}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name="airplane" size={180} color={theme.textSecondary} />
      </View>

      {/* Dashed inner border - classic empty-state cue, inset so it
          doesn't collide with the card's rounded corners. */}
      <View
        pointerEvents="none"
        style={[styles.dashedBorder, { borderColor: theme.textSecondary }]}
      />

      {/* Centre block - plus anchor + title + helper. Bubble flashes coral
          on press so the tap registers visually even before navigation. */}
      <View style={styles.centerBlock}>
        <View
          style={[
            styles.plusBubble,
            pressed
              ? { backgroundColor: theme.accentAction, borderColor: theme.accentAction }
              : { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <Ionicons name="add" size={40} color={pressed ? Palette.white : theme.accentAction} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.helper, { color: theme.textSecondary }]}>{helper}</Text>
      </View>

      <Image
        source={isDark ? LOGO_DARK : LOGO_LIGHT}
        style={styles.brandLogo}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
        </>
      )}
    </Pressable>
  );
}

export default memo(CreateTripCard);

const styles = StyleSheet.create({
  card: {
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  silhouette: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    opacity: 0.08,
    position: 'absolute',
    right: 0,
    top: 0,
    // Slight tilt gives it a little energy without looking messy.
    transform: [{ rotate: '-12deg' }],
  },
  dashedBorder: {
    borderRadius: BorderRadius.lg - 4,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    bottom: Spacing.md,
    left: Spacing.md,
    opacity: 0.6,
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
  },
  centerBlock: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  plusBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: 72,
    ...Shadows.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  helper: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 2,
    textAlign: 'center',
  },
  brandLogo: {
    alignSelf: 'center',
    bottom: Spacing.xxxl,
    height: 54,
    position: 'absolute',
    width: 195,
  },
});

// Sentinel we export alongside the component so the Trips tab can thread
// a typed "create" placeholder through its planned-trips FlatList data
// array without reaching for magic numbers or string unions at the call
// site. Using `as const` keeps the id narrowed to a literal type.
export const CREATE_TRIP_SENTINEL = { __kind: 'create' as const, id: 'create' as const };
export type CreateTripSentinel = typeof CREATE_TRIP_SENTINEL;
