import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrips, useAppTheme } from '@/hooks';
import { useThemeControl } from '@/hooks/useAppTheme';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { geocodeCity } from '@/utils/geocode';
import { countryFlag } from '@/utils/countryFlag';
import type { Trip } from '@/types';

const LOGO_LIGHT = require('@/assets/images/logo/transparent-logo-light.png');
const LOGO_DARK = require('@/assets/images/logo/transparent-logo-dark.png');

type TripPin = Trip & { latitude: number; longitude: number };

type PinStatus = 'completed' | 'inProgress' | 'planned';

function classifyPin(trip: Trip): PinStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (trip.endDate < today) return 'completed';
  if (trip.startDate <= today) return 'inProgress';
  return 'planned';
}

const STATUS_META: Record<PinStatus, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  completed: { icon: 'checkmark-circle', color: Palette.success, label: 'Completed' },
  inProgress: { icon: 'airplane', color: Palette.coral, label: 'In progress' },
  planned: { icon: 'calendar-outline', color: Palette.navy, label: 'Planned' },
};

export default function ExploreScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const theme = useAppTheme();
  const { isDark } = useThemeControl();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const [pins, setPins] = useState<TripPin[]>([]);

  useEffect(() => {
    if (trips.length === 0) return;
    // Per-effect cancellation flag - if `trips` changes (add/delete/rename)
    // while we're awaiting a geocode, the older pass must abandon before
    // it overwrites newer pins. `mounted.current` alone only catches
    // unmount, not stale-within-mount.
    let cancelled = false;
    const loadPins = async () => {
      const results: TripPin[] = [];
      for (const trip of trips) {
        if (cancelled) return;
        if (!trip.destination) continue;
        const coords = await geocodeCity(trip.destination, trip.country);
        if (cancelled) return;
        if (coords) results.push({ ...trip, ...coords });
      }
      if (!cancelled) setPins(results);
    };
    void loadPins();
    return () => {
      cancelled = true;
    };
  }, [trips]);

  // Animate to fit all pins once they've loaded - works the same on both platforms.
  useEffect(() => {
    if (pins.length === 0 || !mapRef.current) return;
    if (pins.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: pins[0].latitude,
          longitude: pins[0].longitude,
          latitudeDelta: 2,
          longitudeDelta: 2,
        },
        500,
      );
    } else {
      mapRef.current.fitToCoordinates(
        pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        {
          edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
          animated: true,
        },
      );
    }
  }, [pins]);

  // Zoom controls - animate the camera by ±1 zoom level. We set both `zoom`
  // (used by Google Maps on Android) and `altitude` (used by Apple Maps on
  // iOS) so the behaviour is identical on both platforms.
  const adjustZoom = useCallback(async (delta: number) => {
    if (!mapRef.current) return;
    const cam = await mapRef.current.getCamera();
    const currentZoom = cam.zoom ?? 5;
    mapRef.current.animateCamera(
      {
        ...cam,
        zoom: currentZoom + delta,
        altitude: (cam.altitude ?? 10000) * (delta > 0 ? 0.5 : 2),
      },
      { duration: 250 },
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
      {/*
        Single basemap: native Apple Maps (iOS) / Google Maps (Android) via
        `PROVIDER_DEFAULT` + `mapType="standard"`. No raster tile overlay -
        one consistent warm Apple palette on iOS and one consistent Google
        palette on Android, never both layered on top of each other.
      */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        mapType="standard"
        style={styles.map}
        initialRegion={{
          latitude: 48,
          longitude: 10,
          latitudeDelta: 25,
          longitudeDelta: 25,
        }}
        showsCompass
      >
        {pins.map((pin) => {
          const status = classifyPin(pin);
          const meta = STATUS_META[status];
          return (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            calloutAnchor={{ x: 0.5, y: 0 }}
            tracksViewChanges={false}
            title={pin.destination}
            description={`${pin.name} - tap to view trip`}
          >
            <View
              style={styles.pinContainer}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${pin.destination} trip marker, ${meta.label}`}
              accessibilityHint="Opens trip details"
            >
              <View style={styles.pinLabel}>
                <Ionicons name={meta.icon} size={14} color={meta.color} style={styles.pinIcon} />
                <Text style={styles.pinText}>{pin.destination}</Text>
                <Text style={styles.pinFlag}>{countryFlag(pin.country)}</Text>
              </View>
              <View style={styles.pinArrow} />
            </View>

            <Callout
              tooltip
              onPress={() => router.push({ pathname: '/trip/[id]/activities', params: { id: pin.id.toString() } })}
            >
              <View
                style={styles.callout}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Open ${pin.name}`}
                accessibilityHint="Tap to view trip"
              >
                <View style={[styles.calloutInner, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                  {pin.coverImage ? (
                    <Image source={{ uri: pin.coverImage }} style={styles.calloutImage} />
                  ) : (
                    <View style={[styles.calloutImage, styles.calloutPlaceholder]}>
                      <Ionicons name="airplane" size={22} color={Palette.white} />
                    </View>
                  )}
                  <View style={styles.calloutInfo}>
                    <Text style={[styles.calloutTitle, { color: theme.textPrimary }]} numberOfLines={1}>{pin.name}</Text>
                    <Text style={[styles.calloutDates, { color: theme.textSecondary }]}>{pin.startDate} → {pin.endDate}</Text>
                    <Text style={styles.calloutAction}>Tap to view trip →</Text>
                  </View>
                </View>
                <View style={[styles.calloutTail, { borderTopColor: theme.cardBackground }]} />
              </View>
            </Callout>
          </Marker>
          );
        })}

      </MapView>

      {/* Floating brand header */}
      <View
        style={[
          styles.header,
          {
            top: insets.top + Spacing.sm,
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
        accessible
        accessibilityRole="header"
        accessibilityLabel="Your TripTastic Map"
      >
        <Image
          source={isDark ? LOGO_DARK : LOGO_LIGHT}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>MAP</Text>
      </View>

      {/* Zoom controls */}
      <View style={[styles.zoomStack, { top: insets.top + Spacing.sm + 48 + Spacing.md }]}>
        <Pressable
          style={[styles.zoomButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => adjustZoom(1)}
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          accessibilityHint="Zooms the map in by one level"
        >
          <Ionicons name="add" size={22} color={theme.textPrimary} />
        </Pressable>
        <Pressable
          style={[styles.zoomButton, styles.zoomButtonBottom, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={() => adjustZoom(-1)}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          accessibilityHint="Zooms the map out by one level"
        >
          <Ionicons name="remove" size={22} color={theme.textPrimary} />
        </Pressable>
      </View>

      {/* Empty state overlay */}
      {trips.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No trips yet</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Create a trip to see it on the map</Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/trip/add')}
            accessibilityRole="button"
            accessibilityLabel="Create trip"
            accessibilityHint="Creates a new trip"
          >
            <Text style={styles.emptyButtonText}>Create Trip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Custom pin
  pinContainer: { alignItems: 'center' },
  pinLabel: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Shadows.md,
  },
  pinIcon: { marginRight: 2 },
  pinText: { color: Palette.navy, fontSize: 12, fontWeight: '800' },
  pinFlag: { fontSize: 14, marginLeft: 2 },
  pinArrow: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 6,
    borderRightColor: 'transparent',
    borderRightWidth: 6,
    borderTopColor: Palette.white,
    borderTopWidth: 6,
    height: 0,
    width: 0,
  },

  // Callout popup (tooltip-mode, identical on iOS + Android)
  callout: {
    alignItems: 'center',
    width: 240,
  },
  calloutInner: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    width: '100%',
    ...Shadows.md,
  },
  calloutImage: { borderRadius: BorderRadius.sm, height: 70, width: 80 },
  calloutPlaceholder: { alignItems: 'center', backgroundColor: Palette.navy, justifyContent: 'center' },
  calloutInfo: { flex: 1, justifyContent: 'center' },
  calloutTitle: { fontSize: 14, fontWeight: '700' },
  calloutDates: { fontSize: 11, marginTop: Spacing.xs },
  calloutAction: { color: Palette.coral, fontSize: 12, fontWeight: '700', marginTop: Spacing.sm },
  calloutTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    borderTopWidth: 8,
    height: 0,
    marginTop: -1,
    width: 0,
  },

  // Floating brand header - rounded pill centred at the top of the map.
  // Uses the transparent logo variants so the coral airplane reads against
  // the themed card fill, same visual family as the zoom buttons.
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    position: 'absolute',
    ...Shadows.md,
  },
  headerLogo: {
    height: 28,
    width: 100,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  // Zoom controls - stacked vertically on the right edge, top offset set
  // inline to clear the floating header regardless of safe-area inset.
  zoomStack: {
    position: 'absolute',
    right: Spacing.lg,
    ...Shadows.md,
  },
  zoomButton: {
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  zoomButtonBottom: {
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
  },

  // Empty
  emptyOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: Spacing.sm },
  emptyButton: {
    backgroundColor: Palette.coral,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  emptyButtonText: { color: Palette.white, fontSize: 15, fontWeight: '700' },
});
