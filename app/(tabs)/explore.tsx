import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips, useCategories, useAppTheme } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { geocodeCity } from '@/utils/geocode';
import { fetchNearbyPlaces, type Place } from '@/utils/geoapify';
import type { Trip } from '@/types';

type TripPin = Trip & { latitude: number; longitude: number };
type PoiPin = Place & { tripId: number };

// Default POI overlay: sightseeing + food (most interesting + dense).
const POI_DEFAULT_CATEGORIES = [1, 2];

export default function ExploreScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const { categories } = useCategories();
  const theme = useAppTheme();
  const mounted = useMountedRef();
  const mapRef = useRef<MapView | null>(null);
  const [pins, setPins] = useState<TripPin[]>([]);
  const [poiEnabled, setPoiEnabled] = useState(false);
  const [pois, setPois] = useState<PoiPin[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);

  const categoryColorMap = useMemo(() => {
    const m = new Map<number, string>();
    categories.forEach((c) => m.set(c.id, c.color));
    return m;
  }, [categories]);

  useEffect(() => {
    if (trips.length === 0) return;
    // Per-effect cancellation flag — if `trips` changes (add/delete/rename)
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

  // Animate to fit all pins once they've loaded — works the same on both platforms.
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

  // Load POIs for each trip pin when the toggle is on.
  useEffect(() => {
    if (!poiEnabled || pins.length === 0) {
      setPois([]);
      return;
    }
    let cancelled = false;
    const loadPois = async () => {
      setPoiLoading(true);
      const all: PoiPin[] = [];
      for (const pin of pins) {
        try {
          const places = await fetchNearbyPlaces({
            lat: pin.latitude,
            lon: pin.longitude,
            categoryIds: POI_DEFAULT_CATEGORIES,
            radiusMeters: 3000,
            limit: 15,
          });
          if (cancelled) return;
          places.forEach((p) => all.push({ ...p, tripId: pin.id }));
        } catch {
          // Swallow per-trip errors; keep any POIs that loaded successfully.
        }
      }
      if (!cancelled && mounted.current) {
        setPois(all);
        setPoiLoading(false);
      }
    };
    void loadPois();
    return () => {
      cancelled = true;
    };
  }, [poiEnabled, pins, mounted]);

  // Zoom controls — animate the camera by ±1 zoom level. We set both `zoom`
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
        `PROVIDER_DEFAULT` + `mapType="standard"`. No raster tile overlay —
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
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            calloutAnchor={{ x: 0.5, y: 0 }}
            tracksViewChanges={false}
            title={pin.destination}
            description={`${pin.name} — tap to view trip`}
          >
            <View
              style={styles.pinContainer}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${pin.destination} trip marker`}
              accessibilityHint="Opens trip details"
            >
              <View style={styles.pinLabel}>
                <Text style={styles.pinText}>{pin.destination}</Text>
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
        ))}

        {/* POI overlay markers (smaller, category-coloured dots) */}
        {poiEnabled && pois.map((poi) => (
          <Marker
            key={`poi-${poi.tripId}-${poi.id}`}
            coordinate={{ latitude: poi.lat, longitude: poi.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            title={poi.name}
            description={poi.address}
          >
            <View
              style={[
                styles.poiDot,
                { backgroundColor: categoryColorMap.get(poi.categoryId) ?? Palette.coral },
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${poi.name} point of interest`}
            />
          </Marker>
        ))}
      </MapView>

      {/* POI toggle floating button */}
      <Pressable
        style={[
          styles.poiToggle,
          {
            backgroundColor: poiEnabled ? Palette.coral : theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
        onPress={() => setPoiEnabled((v) => !v)}
        accessibilityRole="switch"
        accessibilityState={{ checked: poiEnabled }}
        accessibilityLabel="Toggle points of interest"
        accessibilityHint="Shows nearby sightseeing and food places around your trips"
      >
        <Ionicons
          name="location"
          size={16}
          color={poiEnabled ? Palette.white : theme.textPrimary}
        />
        <Text
          style={[
            styles.poiToggleText,
            { color: poiEnabled ? Palette.white : theme.textPrimary },
          ]}
        >
          {poiLoading ? 'Loading…' : poiEnabled ? 'POIs on' : 'Show POIs'}
        </Text>
      </Pressable>

      {/* Zoom controls */}
      <View style={styles.zoomStack}>
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
    backgroundColor: Palette.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Shadows.md,
  },
  pinText: { color: Palette.navy, fontSize: 12, fontWeight: '800' },
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

  // POI markers
  poiDot: {
    borderColor: Palette.white,
    borderRadius: BorderRadius.pill,
    borderWidth: 2,
    height: 14,
    width: 14,
    ...Shadows.sm,
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

  // POI toggle
  poiToggle: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.lg,
    ...Shadows.md,
  },
  poiToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Zoom controls — stacked vertically on the right edge
  zoomStack: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.lg + 48 + Spacing.sm, // below the POI toggle
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
