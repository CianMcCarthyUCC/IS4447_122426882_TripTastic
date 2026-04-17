import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Trip } from '@/types';

type Props = {
  trip: Trip;
  activityCount?: number;
  completedCount?: number;
  onPress: () => void;
  /** Optional explicit width — used for horizontal carousels */
  width?: number;
};

/**
 * Kiwi.com-style trip card — cover image with gradient overlay + text.
 * Works in both light and dark mode (text always white on image).
 */
function TripCard({ trip, activityCount = 0, completedCount = 0, onPress, width }: Props) {
  const theme = useAppTheme();

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
      accessibilityLabel={`${trip.name} — ${trip.destination}`}
      accessibilityHint="Opens trip details"
    >
      {trip.coverImage ? (
        <Image source={{ uri: trip.coverImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="airplane" size={40} color={Palette.white} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.gradient}
      />

      <View style={styles.overlay}>
        <Text style={styles.name} numberOfLines={1}>{trip.name}</Text>
        <Text style={styles.destination}>{trip.destination}, {trip.country}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.dates}>{trip.startDate} → {trip.endDate}</Text>
          {activityCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{completedCount}/{activityCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(TripCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    height: 280,
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: Palette.navy,
    justifyContent: 'center',
  },
  gradient: {
    bottom: 0,
    height: 120,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  overlay: {
    bottom: 0,
    left: 0,
    padding: Spacing.lg,
    position: 'absolute',
    right: 0,
  },
  name: {
    color: Palette.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  destination: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  dates: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Palette.coral,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
