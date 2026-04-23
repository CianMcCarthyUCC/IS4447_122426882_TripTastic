/**
 * Turns a city name into a latitude and longitude. Checks a built-in
 * table first for popular destinations, then falls back to an online
 * service when the city isn't already known.
 */

export type Coords = { latitude: number; longitude: number };

export const CITY_COORDS: Record<string, Coords> = {
  Rome: { latitude: 41.9028, longitude: 12.4964 },
  Paris: { latitude: 48.8566, longitude: 2.3522 },
  London: { latitude: 51.5074, longitude: -0.1278 },
  Tokyo: { latitude: 35.6762, longitude: 139.6503 },
  'New York': { latitude: 40.7128, longitude: -74.006 },
  Dublin: { latitude: 53.3498, longitude: -6.2603 },
  Cork: { latitude: 51.8985, longitude: -8.4756 },
  Barcelona: { latitude: 41.3874, longitude: 2.1686 },
  Sydney: { latitude: -33.8688, longitude: 151.2093 },
  Berlin: { latitude: 52.52, longitude: 13.405 },
  Amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  Lisbon: { latitude: 38.7223, longitude: -9.1393 },
  Prague: { latitude: 50.0755, longitude: 14.4378 },
  Vienna: { latitude: 48.2082, longitude: 16.3738 },
  Madrid: { latitude: 40.4168, longitude: -3.7038 },
};

export async function geocodeCity(city: string, country: string): Promise<Coords | null> {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  if (CITY_COORDS[country]) return CITY_COORDS[country];

  try {
    const key = process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '';
    if (!key) return null;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&appid=${key}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { latitude: data.coord.lat, longitude: data.coord.lon };
  } catch {
    return null;
  }
}
