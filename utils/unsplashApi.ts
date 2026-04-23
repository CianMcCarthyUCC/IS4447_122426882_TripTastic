const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ?? '';
const BASE_URL = 'https://api.unsplash.com';

/**
 * Fetches a nice travel photo for a destination from Unsplash, used as
 * the cover image on trips. Returns null when nothing suitable is found
 * so the UI can fall back gracefully.
 */
export async function getDestinationPhoto(destination: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${destination} travel`);
    const url = `${BASE_URL}/search/photos?query=${query}&per_page=1&orientation=landscape&client_id=${ACCESS_KEY}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    return null;
  } catch {
    return null;
  }
}
