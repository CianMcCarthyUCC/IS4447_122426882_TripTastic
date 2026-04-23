import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Palette, SERIF_FONT } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { countryFlag } from '@/utils/countryFlag';
import { formatDateRange, getNightsCount, getTripStatus } from '@/utils/dateHelpers';
import type { Trip } from '@/types';

type Props = {
  trip: Trip;
  activityCount?: number;
  completedCount?: number;
  onPress: () => void;
  /** Fixed width, used when the card appears in a horizontal carousel. */
  width?: number;
  /**
   * Greys out the cover image so the card reads as "archived" in the Past
   * Trips rail. Headline text stays fully legible.
   */
  muted?: boolean;
};

/**
 * The large trip tile used on the Trips tab and Profile screen. Shows the
 * destination over a cover image, along with dates, nights and progress so
 * the user can see at a glance what each trip is about.
 */
function TripCard({ trip, activityCount = 0, completedCount = 0, onPress, width, muted = false }: Props) {
  const theme = useAppTheme();

  const nights = getNightsCount(trip.startDate, trip.endDate);
  const status = getTripStatus(trip.startDate, trip.endDate);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const percent = activityCount > 0 ? Math.round((completedCount / activityCount) * 100) : 0;

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
      accessibilityLabel={`${trip.name} - ${trip.destination}, ${trip.country}`}
      accessibilityHint="Opens trip details"
    >
      {trip.coverImage ? (
        <Image
          source={{ uri: trip.coverImage }}
          style={styles.image}
          accessible={false}
          importantForAccessibility="no"
          accessibilityLabel={`Photo of ${trip.destination}`}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="airplane" size={40} color={Palette.white} />
        </View>
      )}

      {/* When muted (past trips), drop a warm-grey wash over the cover so
          the card reads as "archived" at a glance. Sits under the dark
          gradient so overlaid text stays fully legible. */}
      {muted ? <View style={styles.mutedOverlay} pointerEvents="none" /> : null}

      {/* Dark wash for legibility behind top + bottom text */}
      <LinearGradient
        colors={[Palette.heroWashTop, 'transparent', Palette.heroWashBottom]}
        locations={[0, 0.35, 1]}
        style={styles.gradient}
      />

      {/* Top row: country badge + relative status */}
      <View style={styles.topRow}>
        <View style={styles.countryBadge} accessibilityLabel={`Country: ${trip.country}`}>
          <Text style={styles.countryFlag}>{countryFlag(trip.country)}</Text>
          <Text style={styles.countryText}>{trip.country.toUpperCase()}</Text>
        </View>

        <View style={styles.statusPill} accessibilityLabel={`Status: ${status}`}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {/* Nights count */}
      <Text style={styles.numberLabel}>
        {nights} {nights === 1 ? 'NIGHT' : 'NIGHTS'}
      </Text>

      {/* Bottom block: hero title + subtitle + divider + footer */}
      <View style={styles.bottomBlock}>
        <Text style={styles.hero} numberOfLines={1}>{trip.destination}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{trip.name}</Text>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>WHEN</Text>
            <Text style={styles.footerValue}>{dateRange}</Text>
            {muted ? (
              <Text style={styles.completedYear}>{trip.endDate.slice(0, 4)}</Text>
            ) : null}
          </View>
          <View style={[styles.footerCol, styles.footerColRight]}>
            <Text style={styles.footerLabel}>PROGRESS</Text>
            <Text style={styles.footerValue}>
              {activityCount > 0 ? `${completedCount} of ${activityCount} · ${percent}%` : 'No activities yet'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(TripCard);

const styles = StyleSheet.create({
  card: {
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
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
  gradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mutedOverlay: {
    backgroundColor: Palette.mutedWash,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // Top row
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: Spacing.lg,
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.lg,
  },
  countryBadge: {
    alignItems: 'center',
    backgroundColor: Palette.glassFill,
    borderColor: Palette.glassBorder,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  countryFlag: {
    fontSize: 14,
  },
  countryText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusPill: {
    backgroundColor: Palette.glassFill,
    borderColor: Palette.glassBorder,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Nº / nights label, sits just below the top row
  numberLabel: {
    color: Palette.textOnImage,
    fontSize: 12,
    fontWeight: '600',
    left: Spacing.lg,
    letterSpacing: 2,
    position: 'absolute',
    top: Spacing.lg + 48, // below the top-row pills
  },

  // Bottom editorial block
  bottomBlock: {
    bottom: 0,
    left: 0,
    padding: Spacing.lg,
    position: 'absolute',
    right: 0,
  },
  hero: {
    color: Palette.white,
    fontFamily: SERIF_FONT,
    fontSize: 44,
    fontStyle: 'italic',
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    color: Palette.textOnImage,
    fontSize: 15,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  divider: {
    backgroundColor: Palette.glassDivider,
    height: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: {
    flex: 1,
  },
  footerColRight: {
    alignItems: 'flex-end',
  },
  footerLabel: {
    color: Palette.textOnImageDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  footerValue: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  completedYear: {
    color: Palette.textOnImageDim,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
