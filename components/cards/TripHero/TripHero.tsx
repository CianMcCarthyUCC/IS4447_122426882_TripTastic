import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Palette, SERIF_FONT, Shadows, Spacing } from '@/constants';
import { countryFlag } from '@/utils/countryFlag';
import { formatDateRange } from '@/utils/dateHelpers';
import type { Trip } from '@/types';

type Props = {
  trip: Trip;
  completedCount: number;
  totalCount: number;
  onBack: () => void;
};

/**
 * Editorial hero for the trip detail screen — full-bleed cover image, circular
 * back button, country + destination + date/progress line overlaid on the
 * bottom of the image. Kept presentational: the screen owns the data and the
 * back handler so navigation stays where routing logic lives.
 */
function TripHero({ trip, completedCount, totalCount, onBack }: Props) {
  const insets = useSafeAreaInsets();
  // Sit the back button just under the status bar on every device.
  const topOffset = insets.top + Spacing.sm;

  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const progressLabel =
    totalCount > 0
      ? `${dateRange} · ${completedCount} of ${totalCount} complete`
      : dateRange;

  return (
    <View style={styles.container}>
      {trip.coverImage ? (
        <Image source={{ uri: trip.coverImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="airplane" size={48} color={Palette.white} />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [
          styles.circleButton,
          { top: topOffset, left: Spacing.lg, opacity: pressed ? 0.75 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={Palette.grey900} />
      </Pressable>

      <View style={styles.caption}>
        <View style={styles.countryRow} accessibilityLabel={`Country: ${trip.country}`}>
          <Text style={styles.countryFlag}>{countryFlag(trip.country)}</Text>
          <Text style={styles.countryLabel}>{trip.country.toUpperCase()}</Text>
        </View>

        <Text style={styles.hero} numberOfLines={1} accessibilityRole="header">
          {trip.destination}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {progressLabel}
        </Text>
      </View>
    </View>
  );
}

export default memo(TripHero);

const styles = StyleSheet.create({
  container: {
    // 4:3 fills roughly half the screen on a phone; matches the reference design.
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: Palette.navy,
    justifyContent: 'center',
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: BorderRadius.pill,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    width: 40,
    ...Shadows.sm,
  },
  caption: {
    bottom: Spacing.lg,
    left: Spacing.lg,
    position: 'absolute',
    right: Spacing.lg,
  },
  countryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryLabel: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  hero: {
    color: Palette.white,
    fontFamily: SERIF_FONT,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 56,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
});
