/**
 * Gemini API wrapper — thin fetch() against the REST endpoint rather than
 * the `@google/generative-ai` SDK. Dropping the SDK keeps the Expo bundle
 * small and avoids the Node-only polyfills the SDK pulls in under
 * Metro (stream, buffer, etc).
 *
 * Contract:
 *   1. `isAiConfigured()` — cheap check for whether the API key is
 *      present; UI uses it to decide between "Generate" and a friendly
 *      "Configure API key" empty state.
 *   2. `generateTripOverview(...)` — builds the structured prompt from
 *      SQLite-backed data (trip + activities + categories), asks Gemini
 *      for JSON, parses, and returns a typed result.
 *
 * Failure modes (network down, quota exhausted, JSON malformed, schema
 * drift) all throw a `GeminiError` with a user-safe message — the UI
 * surfaces it in an error card rather than crashing the tab.
 */
import type { Activity, Category, Trip } from '@/types';

/**
 * Identifier baked into cached rows so we can invalidate on model upgrade.
 *
 * `gemini-flash-latest` is Google's moving alias for the current Flash
 * tier — keeps us on the freshest model without manual bumps, at the
 * cost of slightly less precise cache invalidation (the `model` column
 * on cached rows can't distinguish between two generations that both
 * resolved to `-latest` at different times). Acceptable for this use
 * case since overviews are cheap to regenerate.
 */
export const GEMINI_MODEL = 'gemini-flash-latest';

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Shape returned to callers — mirrors the cached overview row minus metadata. */
export type GeminiOverviewResult = {
  /** 2–3 paragraph plain-prose trip overview. */
  content: string;
  /**
   * Activity IDs in the recommended order. A subset of the input IDs (the
   * model may drop invalid ones) but never contains unknown IDs — we
   * sanitise against the input set before returning.
   */
  recommendedOrder: number[];
  /** Short explanation (one sentence) of why this order, surfaced in the UI. */
  rationale: string;
};

/**
 * Classification of Gemini failure paths. Lets the UI branch on *kind*
 * rather than parsing the message string — so we can render a friendly
 * rate-limit countdown for 429s, a key-setup prompt for auth failures,
 * etc. Unknown / truly unexpected paths fall back to 'unknown'.
 */
export type GeminiErrorKind =
  | 'rate-limit'
  | 'auth'
  | 'missing-key'
  | 'no-activities'
  | 'network'
  | 'parse'
  | 'empty'
  | 'unknown';

/** Thrown for any non-success path — message is safe to show to the user. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly kind: GeminiErrorKind = 'unknown',
    /**
     * When `kind === 'rate-limit'`, how many seconds the user should
     * wait before the next attempt. Parsed from Google's RetryInfo
     * envelope when present, falls back to parsing the message text.
     */
    readonly retryAfterSeconds?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/** True when the env var is populated with something non-placeholder-looking. */
export function isAiConfigured(): boolean {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return typeof key === 'string' && key.length > 10 && !key.includes('REPLACE');
}

/**
 * Build the structured prompt. Kept pure (no fetch) so it can be unit-tested
 * independently of the network layer. The prompt explicitly asks for JSON
 * — strict `responseMimeType: 'application/json'` in the fetch call makes
 * the model honour it more reliably than relying on prose instructions
 * alone, but we keep the belt-and-braces phrasing for older tiers.
 */
export function buildPrompt(
  trip: Trip,
  activities: Activity[],
  categories: Category[],
): string {
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  const activityLines = activities.map((a) => {
    const category = categoryById.get(a.categoryId) ?? 'Uncategorised';
    const notes = a.notes?.trim() ? ` — ${a.notes.trim()}` : '';
    return `- id=${a.id} | ${category} | ${a.date} | ${a.metric}min | ${a.status}${notes}`;
  });

  return [
    `You are a concise travel guide assistant. Given a trip and its activities,`,
    `write a 2–3 paragraph trip overview and recommend the order to do the`,
    `activities in, optimising for:`,
    `  • keeping activities close together by location (use the notes as`,
    `    location/context hints — don't invent locations)`,
    `  • grouping longer durations earlier in the day when possible`,
    `  • respecting the provided activity dates as a soft anchor`,
    ``,
    `Trip: ${trip.name}`,
    `Destination: ${trip.destination}, ${trip.country}`,
    `Dates: ${trip.startDate} → ${trip.endDate}`,
    ``,
    `Activities:`,
    ...activityLines,
    ``,
    `Respond with ONLY a JSON object of the shape:`,
    `{`,
    `  "content": string,              // 2–3 paragraph plain-prose overview`,
    `  "recommendedOrder": number[],   // activity ids from above, reordered`,
    `  "rationale": string             // one sentence explaining the order`,
    `}`,
    `Every id in recommendedOrder MUST appear in the input list above.`,
    `Do not include activities that weren't provided.`,
  ].join('\n');
}

/**
 * Sanitise the model's `recommendedOrder` so downstream UI code can trust
 * it blindly: drop unknown IDs, de-duplicate, and preserve the relative
 * order the model picked for the survivors.
 */
function sanitiseOrder(raw: unknown, validIds: Set<number>): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const v of raw) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (!validIds.has(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/**
 * Call Gemini with the structured prompt and return a typed, sanitised
 * result. Never throws for network-level issues without wrapping the
 * error in `GeminiError` first — the UI relies on that to branch.
 */
export async function generateTripOverview(
  trip: Trip,
  activities: Activity[],
  categories: Category[],
): Promise<GeminiOverviewResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      'Missing EXPO_PUBLIC_GEMINI_API_KEY — add it to .env and restart the dev server.',
      'missing-key',
    );
  }
  if (activities.length === 0) {
    throw new GeminiError(
      'Add at least one activity before generating an AI overview.',
      'no-activities',
    );
  }

  const prompt = buildPrompt(trip, activities, categories);
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // Force JSON mode — the v1beta endpoint honours this for 2.0+ models
      // and makes parsing deterministic.
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GeminiError(
      'Network error contacting Gemini. Check your connection and try again.',
      'network',
      undefined,
      err,
    );
  }

  if (!response.ok) {
    // Read the body once — downstream classification looks at both the
    // status code and the error payload details (RetryInfo, quota
    // metadata) for an accurate kind + retry-after.
    let errorPayload: unknown;
    try {
      errorPayload = await response.json();
    } catch {
      /* body wasn't JSON — pass undefined along */
    }
    throw classifyHttpError(response.status, response.statusText, errorPayload);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (err) {
    throw new GeminiError(
      'Could not parse Gemini response body.',
      'parse',
      undefined,
      err,
    );
  }

  // Gemini nests the text inside candidates[].content.parts[].text. Pull
  // the first candidate's concatenated text parts — multi-part responses
  // are rare for this endpoint but we join just in case.
  const text = extractFirstCandidateText(payload);
  if (!text) {
    throw new GeminiError('Gemini returned an empty response.', 'empty');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new GeminiError(
      'Gemini returned non-JSON output. Try regenerating.',
      'parse',
      undefined,
      err,
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new GeminiError('Gemini response was not an object.', 'parse');
  }
  const record = parsed as Record<string, unknown>;
  const content = typeof record.content === 'string' ? record.content.trim() : '';
  const rationale = typeof record.rationale === 'string' ? record.rationale.trim() : '';
  if (!content) {
    throw new GeminiError('Gemini response was missing the overview content.', 'empty');
  }

  const validIds = new Set(activities.map((a) => a.id));
  const recommendedOrder = sanitiseOrder(record.recommendedOrder, validIds);

  return { content, recommendedOrder, rationale };
}

/**
 * Map an HTTP failure (non-2xx response) onto the right `GeminiError`.
 * Status code alone doesn't distinguish "key is rejected" vs "quota was
 * hit" — both can come back as 403 in some projects — so we also look at
 * the response body's `error.status` string (Google's canonical enum)
 * and any RetryInfo hint before picking a kind.
 */
function classifyHttpError(
  status: number,
  statusText: string,
  payload: unknown,
): GeminiError {
  const retryAfterSeconds = extractRetryAfter(payload);
  const apiMessage = extractApiErrorMessage(payload);

  if (status === 401 || status === 403) {
    return new GeminiError(
      'Gemini rejected the API key. Check EXPO_PUBLIC_GEMINI_API_KEY is valid and has access to the Generative Language API.',
      'auth',
    );
  }

  // 429 is the canonical rate-limit / quota path. We render it as
  // rate-limit regardless of whether it's a per-minute cap or a daily
  // quota — the UI copy + countdown is the same either way.
  if (status === 429) {
    return new GeminiError(
      retryAfterSeconds
        ? `Gemini's rate limit was hit. Try again in ${formatSecondsShort(retryAfterSeconds)}.`
        : 'Gemini\u2019s rate limit was hit. Try again in a minute.',
      'rate-limit',
      retryAfterSeconds,
    );
  }

  if (status >= 500 && status < 600) {
    return new GeminiError(
      'Gemini is having a temporary issue. Try again in a moment.',
      'network',
    );
  }

  // Truly unexpected — fall back to a terse status line rather than the
  // raw API payload, which can be paragraphs long (quota tables, URLs,
  // internal metric names) and unreadable to end users.
  return new GeminiError(
    apiMessage
      ? `Gemini couldn\u2019t complete the request (${status}).`
      : `Gemini returned ${status} ${statusText}.`,
    'unknown',
  );
}

/**
 * Pull a retry-after duration (seconds) from a Google error envelope.
 * Prefers the typed `google.rpc.RetryInfo` detail when present, and
 * falls back to regex-parsing the human-readable "retry in Xs" hint
 * some error messages include.
 */
function extractRetryAfter(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const err = (payload as { error?: unknown }).error;
  if (!err || typeof err !== 'object') return undefined;

  const details = (err as { details?: unknown[] }).details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (!detail || typeof detail !== 'object') continue;
      const type = (detail as { '@type'?: unknown })['@type'];
      if (type !== 'type.googleapis.com/google.rpc.RetryInfo') continue;
      const delay = (detail as { retryDelay?: unknown }).retryDelay;
      if (typeof delay !== 'string') continue;
      // Google uses the protobuf Duration string format — e.g. "57s" or
      // "57.984668611s". Strip the trailing `s` and parse.
      const match = /^(\d+(?:\.\d+)?)s$/.exec(delay);
      if (match) return Math.max(1, Math.ceil(Number(match[1])));
    }
  }

  const message = (err as { message?: unknown }).message;
  if (typeof message === 'string') {
    const match = /retry in\s+([\d.]+)\s*s/i.exec(message);
    if (match) return Math.max(1, Math.ceil(Number(match[1])));
  }
  return undefined;
}

/** Safely pull `error.message` from a Google-shaped error envelope. */
function extractApiErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const err = (payload as { error?: unknown }).error;
  if (!err || typeof err !== 'object') return undefined;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

/** Turn an integer number of seconds into "45s" or "2 minutes". */
function formatSecondsShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins === 1 ? '' : 's'}`;
}

/**
 * Walk the Gemini response envelope defensively — any missing shape at any
 * level just returns an empty string, which the caller turns into a
 * GeminiError with a user-friendly message.
 */
function extractFirstCandidateText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const first = candidates[0] as { content?: { parts?: Array<{ text?: string }> } };
  const parts = first?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .filter(Boolean)
    .join('');
}
