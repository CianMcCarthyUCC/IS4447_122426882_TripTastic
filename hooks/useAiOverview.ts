import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAiOverview, upsertAiOverview, clearAiOverview } from '@/db';
import {
  generateTripOverview,
  isAiConfigured,
  GeminiError,
  GEMINI_MODEL,
} from '@/services';
import type { GeminiErrorKind } from '@/services';
import { useMountedRef } from './useMountedRef';
import type { Activity, Category, Trip, TripAiOverview } from '@/types';

type UseAiOverviewResult = {
  /** Cached overview for this trip, or null when none exists yet. */
  overview: TripAiOverview | null;
  /** True while the initial SQLite read is in flight. */
  isLoading: boolean;
  /** True while a Gemini call is in flight (generate or regenerate). */
  isGenerating: boolean;
  /** User-safe error message from the last generate attempt, or null. */
  error: string | null;
  /**
   * Classification of the last error so the UI can branch on kind rather
   * than parsing message strings. Null when there is no active error.
   */
  errorKind: GeminiErrorKind | null;
  /**
   * Absolute epoch-ms timestamp the next generate attempt is allowed at,
   * or null when no rate-limit is active. The card ticks a countdown
   * against this and re-enables its button once the time passes.
   */
  retryAt: number | null;
  /** True when the app has a Gemini API key configured. */
  configured: boolean;
  /** Fire a Gemini call, persist the result, and update state. Idempotent. */
  generate: (trip: Trip, activities: Activity[], categories: Category[]) => Promise<void>;
  /** Remove the cached overview (user tapped "Clear"). */
  clear: (tripId: number) => Promise<void>;
  /** One-sentence rationale from the most recent generation, if any. */
  rationale: string | null;
};

/**
 * Coordinates the Gemini API, the SQLite cache, and component state for
 * the AI travel-guide card. The cache is keyed by `tripId` — each trip
 * holds at most one overview, so swapping trips via the selector
 * invalidates + re-reads on mount.
 *
 * Hook-level invariants:
 *   • Never sets state after unmount (guarded via `useMountedRef`).
 *   • Never exposes a Gemini error as an exception — callers branch on
 *     the `error` string instead, which mirrors the `useFormSubmit` style
 *     used elsewhere in the app.
 *   • A generate call that was kicked off for trip A never commits its
 *     result to trip A's cache if the user has since switched to trip B.
 *     The request's origin tripId is captured in `inFlightTripIdRef` and
 *     re-checked before the upsert/setState pair runs.
 */
export function useAiOverview(tripId: number | null): UseAiOverviewResult {
  const mountedRef = useMountedRef();
  const [overview, setOverview] = useState<TripAiOverview | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<GeminiErrorKind | null>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);

  // Mirror the latest selected tripId into a ref so the `generate` callback
  // can detect a trip-switch that happened mid-request and bail out before
  // writing stale results back. Refs (vs closed-over tripId) make the check
  // race-free without forcing every generate caller to re-memoise.
  const latestTripIdRef = useRef<number | null>(tripId);
  useEffect(() => {
    latestTripIdRef.current = tripId;
  }, [tripId]);

  // API key presence is stable across a session — memoising avoids a fresh
  // `process.env` read on every render for callers that destructure `configured`.
  const configured = useMemo(() => isAiConfigured(), []);

  // Initial load — runs whenever the active tripId changes. A tripId of
  // `null` (trip not yet resolved) leaves state at defaults.
  useEffect(() => {
    let cancelled = false;
    if (tripId == null) return;
    setIsLoading(true);
    getAiOverview(tripId)
      .then((row) => {
        if (cancelled || !mountedRef.current) return;
        setOverview(row);
        // Rationale isn't persisted — it only lives on the in-memory
        // result from the most recent generate, because it's a "session"
        // concern (explaining why THIS regenerate picked THIS order).
        setRationale(null);
        setError(null);
        setErrorKind(null);
        setRetryAt(null);
      })
      .catch(() => {
        if (cancelled || !mountedRef.current) return;
        setError('Could not load the saved AI overview.');
        setErrorKind('unknown');
      })
      .finally(() => {
        if (cancelled || !mountedRef.current) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, mountedRef]);

  const generate = useCallback(
    async (trip: Trip, activities: Activity[], categories: Category[]) => {
      setError(null);
      setErrorKind(null);
      setRetryAt(null);
      setIsGenerating(true);
      const requestTripId = trip.id;
      try {
        const result = await generateTripOverview(trip, activities, categories);
        // Race check — if the user swapped trips while the network call
        // was in flight, don't persist this response against a cache key
        // whose screen is no longer visible. The request's content is
        // discarded rather than written to the wrong trip.
        if (latestTripIdRef.current !== requestTripId) return;
        const nextRow: TripAiOverview = {
          tripId: requestTripId,
          content: result.content,
          recommendedOrder: result.recommendedOrder,
          model: GEMINI_MODEL,
          generatedAt: new Date().toISOString(),
        };
        await upsertAiOverview(nextRow);
        // Re-check after the async DB write as well — user could switch
        // trips between the API response and the SQLite upsert resolving.
        if (!mountedRef.current || latestTripIdRef.current !== requestTripId) return;
        setOverview(nextRow);
        setRationale(result.rationale || null);
      } catch (err) {
        if (!mountedRef.current || latestTripIdRef.current !== requestTripId) return;
        // GeminiError messages are vetted for user display; anything else
        // gets a generic fallback so we don't leak stack traces into UI.
        if (err instanceof GeminiError) {
          setError(err.message);
          setErrorKind(err.kind);
          // For rate-limit failures, remember when the user can retry so
          // the card can render a live countdown + keep the button
          // disabled for the duration. Absolute timestamp (not a
          // remaining duration) keeps us accurate across re-renders.
          if (err.kind === 'rate-limit' && typeof err.retryAfterSeconds === 'number') {
            setRetryAt(Date.now() + err.retryAfterSeconds * 1000);
          } else {
            setRetryAt(null);
          }
        } else {
          setError('Something went wrong generating your overview.');
          setErrorKind('unknown');
          setRetryAt(null);
        }
      } finally {
        // `isGenerating` is screen-level so we clear it unconditionally —
        // the trip-switch path doesn't care about the spinner on the old
        // card (it's unmounted) and the current card is in its own state.
        if (mountedRef.current) setIsGenerating(false);
      }
    },
    [mountedRef],
  );

  const clear = useCallback(
    async (tid: number) => {
      await clearAiOverview(tid);
      if (!mountedRef.current) return;
      setOverview(null);
      setRationale(null);
      setError(null);
      setErrorKind(null);
      setRetryAt(null);
    },
    [mountedRef],
  );

  return {
    overview,
    isLoading,
    isGenerating,
    error,
    errorKind,
    retryAt,
    configured,
    generate,
    clear,
    rationale,
  };
}
