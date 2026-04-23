import { useCallback, useEffect, useState } from 'react';
import { fetchNearbyPlaces, type Place } from '@/utils/geoapify';

type Params = {
  lat?: number;
  lon?: number;
  categoryIds: number[];
  radiusMeters?: number;
  limit?: number;
};

type Result = {
  places: Place[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Fetches nearby points of interest around a coordinate. Waits quietly
 * until both latitude and longitude are known, so callers don't need to
 * guard the call themselves.
 */
export function usePlaces({ lat, lon, categoryIds, radiusMeters, limit }: Params): Result {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const key = categoryIds.slice().sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setPlaces([]);
      setError(null);
      return;
    }

    // Per-effect-run cancellation flag - protects against stale responses
    // when the user changes category / coordinate while a previous fetch
    // is still in flight. Strictly stronger than a mounted-ref because it
    // flips on every re-run, not just unmount.
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchNearbyPlaces({ lat, lon, categoryIds, radiusMeters, limit })
      .then((result) => {
        if (cancelled) return;
        setPlaces(result);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load places');
        setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // categoryIds is intentionally tracked via the serialised `key`
    // so we re-fetch on content change, not array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, key, radiusMeters, limit, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { places, loading, error, refresh };
}
