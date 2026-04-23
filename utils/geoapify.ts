/**
 * Wraps the Geoapify "Places" service, which finds interesting places
 * near a coordinate. Returns the places mapped to the app's own
 * categories so they can be filtered and coloured like everything else.
 */

export type Place = {
  /** Stable Geoapify `place_id`. */
  id: string;
  name: string;
  /** Raw Geoapify categories, e.g. ["catering.restaurant", "catering"]. */
  categories: string[];
  lat: number;
  lon: number;
  address?: string;
  /** Nearest app category (1-5). Used for colour + list filtering. */
  categoryId: number;
};

/**
 * App category id → comma-joined Geoapify category string.
 * Seeded app categories are: 1 Sightseeing, 2 Food, 3 Transport,
 * 4 Accommodation, 5 Shopping.
 */
export const GEOAPIFY_CATEGORY_MAP: Record<number, string> = {
  1: 'tourism.sights,tourism.attraction,leisure.park',
  2: 'catering.restaurant,catering.cafe,catering.fast_food',
  3: 'public_transport.train,public_transport.bus,public_transport.subway',
  4: 'accommodation.hotel,accommodation.guest_house,accommodation.hostel',
  5: 'commercial.supermarket,commercial.shopping_mall,commercial.marketplace',
};

/**
 * Reverse-lookup: given a raw Geoapify category like "catering.restaurant",
 * return the nearest app categoryId. Falls back to 1 (Sightseeing) if no
 * prefix matches - acceptable since Sightseeing is the "general interest" bucket.
 */
export function mapGeoapifyCategoryToApp(geoapifyCategories: string[]): number {
  for (const raw of geoapifyCategories) {
    if (raw.startsWith('catering')) return 2;
    if (raw.startsWith('public_transport') || raw.startsWith('transport')) return 3;
    if (raw.startsWith('accommodation')) return 4;
    if (raw.startsWith('commercial')) return 5;
    if (raw.startsWith('tourism') || raw.startsWith('leisure') || raw.startsWith('heritage')) return 1;
  }
  return 1;
}

type FetchParams = {
  lat: number;
  lon: number;
  /** App category ids to include. Empty array → all five. */
  categoryIds: number[];
  /** Default 3km. */
  radiusMeters?: number;
  /** Default 20. Max 500 per Geoapify docs. */
  limit?: number;
};

export async function fetchNearbyPlaces({
  lat,
  lon,
  categoryIds,
  radiusMeters = 3000,
  limit = 20,
}: FetchParams): Promise<Place[]> {
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? '';
  if (!key) throw new Error('API key not configured');

  const ids = categoryIds.length > 0 ? categoryIds : [1, 2, 3, 4, 5];
  const categories = ids
    .map((id) => GEOAPIFY_CATEGORY_MAP[id])
    .filter(Boolean)
    .join(',');

  const url =
    `https://api.geoapify.com/v2/places` +
    `?categories=${encodeURIComponent(categories)}` +
    `&filter=${encodeURIComponent(`circle:${lon},${lat},${radiusMeters}`)}` +
    `&bias=${encodeURIComponent(`proximity:${lon},${lat}`)}` +
    `&limit=${limit}` +
    `&apiKey=${key}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geoapify request failed (${res.status})`);
  const data = await res.json();

  const features: any[] = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((f): Place | null => {
      const p = f?.properties;
      if (!p || typeof p.lat !== 'number' || typeof p.lon !== 'number') return null;
      const id = p.place_id ?? `${p.lat},${p.lon}`;
      // Drop rows Geoapify can't name at all - an "Unnamed place" card is
      // effectively noise for the user since they can't tell one from the
      // next, and the surrounding list already has plenty of real POIs.
      const resolvedName: string | undefined = p.name ?? p.address_line1;
      if (!resolvedName) return null;
      const name: string = resolvedName;
      const rawCategories: string[] = Array.isArray(p.categories) ? p.categories : [];
      return {
        id,
        name,
        categories: rawCategories,
        lat: p.lat,
        lon: p.lon,
        address: p.address_line2 ?? p.formatted,
        categoryId: mapGeoapifyCategoryToApp(rawCategories),
      };
    })
    .filter((p): p is Place => p !== null);
}
