import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useTrips, useAppTheme } from '@/hooks';
import { useMountedRef } from '@/hooks/useMountedRef';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import type { Trip } from '@/types';

type TripPin = Trip & { latitude: number; longitude: number };

const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Rome: { latitude: 41.9028, longitude: 12.4964 },
  Paris: { latitude: 48.8566, longitude: 2.3522 },
  London: { latitude: 51.5074, longitude: -0.1278 },
  Tokyo: { latitude: 35.6762, longitude: 139.6503 },
  'New York': { latitude: 40.7128, longitude: -74.006 },
  Dublin: { latitude: 53.3498, longitude: -6.2603 },
  Barcelona: { latitude: 41.3874, longitude: 2.1686 },
  Sydney: { latitude: -33.8688, longitude: 151.2093 },
  Berlin: { latitude: 52.52, longitude: 13.405 },
  Amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  Lisbon: { latitude: 38.7223, longitude: -9.1393 },
  Prague: { latitude: 50.0755, longitude: 14.4378 },
  Vienna: { latitude: 48.2082, longitude: 16.3738 },
  Madrid: { latitude: 40.4168, longitude: -3.7038 },
};

async function geocodeCity(city: string, country: string): Promise<{ latitude: number; longitude: number } | null> {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  try {
    const key = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&appid=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { latitude: data.coord.lat, longitude: data.coord.lon };
  } catch {
    return null;
  }
}

// CartoDB Voyager raster tiles — free, no key, more vibrant than default OSM.
// Blue water, green parks, warm road tones. Works on iOS + Android.
const TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const TILE_MAX_ZOOM = 19;

export default function ExploreScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const theme = useAppTheme();
  const mounted = useMountedRef();
  const mapRef = useRef<MapView | null>(null);
  const [pins, setPins] = useState<TripPin[]>([]);

  useEffect(() => {
    const loadPins = async () => {
      const results: TripPin[] = [];
      for (const trip of trips) {
        // Skip trips with no destination
        if (!trip.destination) continue;
        // Try destination first, then country, then geocode
        const coords =
          CITY_COORDS[trip.destination] ??
          CITY_COORDS[trip.country] ??
          (await geocodeCity(trip.destination, trip.country));
        if (coords && mounted.current) results.push({ ...trip, ...coords });
      }
      if (mounted.current) setPins(results);
    };
    if (trips.length > 0) void loadPins();
  }, [trips, mounted]);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground }]}>
      {/* Full-screen map — OSM tiles render the basemap on both iOS and Android */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        // mapType="none" hides the native Apple/Google basemap so only OSM tiles show.
        mapType="none"
        style={styles.map}
        initialRegion={{
          latitude: 48,
          longitude: 10,
          latitudeDelta: 25,
          longitudeDelta: 25,
        }}
        showsCompass
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={TILE_MAX_ZOOM} zIndex={-1} />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            // Android needs explicit anchor for custom marker views to sit correctly.
            anchor={{ x: 0.5, y: 1 }}
            calloutAnchor={{ x: 0.5, y: 0 }}
            tracksViewChanges={false}
            title={pin.destination}
            description={`${pin.name} — tap to view trip`}
          >
            {/* Custom pin label */}
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

            {/* Callout with image — tooltip mode renders our view identically on iOS + Android */}
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
                <View style={styles.calloutInner}>
                  {pin.coverImage ? (
                    <Image source={{ uri: pin.coverImage }} style={styles.calloutImage} />
                  ) : (
                    <View style={[styles.calloutImage, styles.calloutPlaceholder]}>
                      <Text style={styles.calloutFlag}>✈️</Text>
                    </View>
                  )}
                  <View style={styles.calloutInfo}>
                    <Text style={styles.calloutTitle} numberOfLines={1}>{pin.name}</Text>
                    <Text style={styles.calloutDates}>{pin.startDate} → {pin.endDate}</Text>
                    <Text style={styles.calloutAction}>Tap to view trip →</Text>
                  </View>
                </View>
                <View style={styles.calloutTail} />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

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

  // Callout popup (tooltip-mode, identical on iOS + Android)
  callout: {
    alignItems: 'center',
    width: 240,
  },
  calloutInner: {
    backgroundColor: Palette.white,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    width: '100%',
    ...Shadows.md,
  },
  calloutImage: { borderRadius: BorderRadius.sm, height: 70, width: 80 },
  calloutPlaceholder: { alignItems: 'center', backgroundColor: Palette.navy, justifyContent: 'center' },
  calloutFlag: { fontSize: 24 },
  calloutInfo: { flex: 1, justifyContent: 'center' },
  calloutTitle: { color: Palette.navy, fontSize: 14, fontWeight: '700' },
  calloutDates: { color: '#666', fontSize: 11, marginTop: Spacing.xs },
  calloutAction: { color: Palette.coral, fontSize: 12, fontWeight: '700', marginTop: Spacing.sm },
  calloutTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    borderTopColor: Palette.white,
    borderTopWidth: 8,
    height: 0,
    marginTop: -1,
    width: 0,
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
