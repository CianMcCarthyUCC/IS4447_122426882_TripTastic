import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useHaptics } from '@/hooks';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { formatIsoDate } from '@/utils/dateHelpers';
import { AiOverviewHeader } from './AiOverviewHeader';
import { OrderedStepRow } from './OrderedStepRow';
import type { GeminiErrorKind } from '@/services';
import type { Activity, Category, TripAiOverview } from '@/types';

type Props = {
  /** Cached overview row, or null when nothing has been generated yet. */
  overview: TripAiOverview | null;
  /** Parent-provided list of activities — used to resolve the ordered ID list into display rows. */
  activities: Activity[];
  /** Categories for rendering the coloured chip next to each recommended activity. */
  categories: Category[];
  /** True while the SQLite cache is being read on tripId change. */
  isLoading: boolean;
  /** True while a Gemini round-trip is in flight. */
  isGenerating: boolean;
  /** User-safe error from the last generate attempt, or null. */
  error: string | null;
  /** Classification of the error so we can render a per-kind message + CTA. */
  errorKind: GeminiErrorKind | null;
  /**
   * Absolute epoch-ms timestamp the next attempt is allowed at. Non-null
   * only when the last error was a rate-limit; drives the countdown + the
   * disabled state on the Generate button.
   */
  retryAt: number | null;
  /** Rationale string from the most recent generate, if any. */
  rationale: string | null;
  /** Whether the API key is present — drives the empty state. */
  configured: boolean;
  /** Click handler for the primary "Generate" / "Regenerate" CTA. */
  onGenerate: () => void;
  /** Optional clear handler; only rendered when an overview exists. */
  onClear?: () => void;
};

/**
 * AI travel-guide card. One composite card that handles every state the
 * feature can be in (no key, loading cache, no overview yet, has
 * overview, generating, error). Colocating the states means the
 * InsightsSection only renders one element regardless of status, which
 * keeps its layout stable and avoids layout shift on regenerate.
 *
 * Subcomponents (`AiOverviewHeader`, `OrderedStepRow`) are memoised
 * siblings so the list portion can re-render one row at a time rather
 * than re-rendering the full card on every tap.
 */
export function AiOverviewCard({
  overview,
  activities,
  categories,
  isLoading,
  isGenerating,
  error,
  errorKind,
  retryAt,
  rationale,
  configured,
  onGenerate,
  onClear,
}: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();

  // Fire haptics on generation lifecycle transitions. The refs capture
  // the previous value so we only buzz on the *edge*, not every render
  // while the state happens to be truthy.
  const wasGenerating = useRef(false);
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (wasGenerating.current && !isGenerating && !error) {
      haptics.success();
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating, error, haptics]);
  useEffect(() => {
    if (error && error !== lastErrorRef.current) haptics.error();
    lastErrorRef.current = error;
  }, [error, haptics]);

  // Live countdown for rate-limit cooldown. We tick a local `nowMs`
  // state every second while a retryAt is active, then derive the
  // remaining seconds on each render. Stopping the interval once the
  // countdown elapses avoids a free-running timer for the rest of the
  // session.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (retryAt === null) return;
    if (retryAt <= Date.now()) return;
    setNowMs(Date.now());
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= retryAt) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAt]);
  const remainingMs = retryAt === null ? 0 : Math.max(0, retryAt - nowMs);
  const isCoolingDown = remainingMs > 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  // Map lookups — category-per-id is used for the step row chip, activity-per-id
  // is used to resolve recommended IDs into display rows.
  const activityById = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const orderedActivities = useMemo(() => {
    if (!overview) return [];
    return overview.recommendedOrder
      .map((id) => activityById.get(id))
      .filter((a): a is Activity => !!a);
  }, [overview, activityById]);

  const handleGeneratePress = useCallback(() => {
    haptics.medium();
    onGenerate();
  }, [haptics, onGenerate]);

  const handleClearPress = useCallback(() => {
    haptics.light();
    onClear?.();
  }, [haptics, onClear]);

  const frameStyle = [
    styles.card,
    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
  ];

  if (!configured) {
    return (
      <View style={frameStyle} accessibilityRole="summary">
        <AiOverviewHeader />
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Add your Gemini API key to <Text style={styles.code}>.env</Text> as{' '}
          <Text style={styles.code}>EXPO_PUBLIC_GEMINI_API_KEY</Text> and restart the dev
          server to unlock the AI travel guide.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={frameStyle}
        accessibilityRole="summary"
        accessibilityLabel="Loading saved AI overview"
      >
        <AiOverviewHeader />
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Palette.aiViolet} />
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Loading saved overview…
          </Text>
        </View>
      </View>
    );
  }

  const primaryLabel = overview ? 'Regenerate' : 'Generate AI travel guide';
  const primaryIcon = overview ? 'refresh' : 'sparkles';

  return (
    <View style={frameStyle} accessibilityRole="summary">
      <AiOverviewHeader />

      {overview ? (
        <>
          <Text style={[styles.bodyText, { color: theme.textPrimary }]}>{overview.content}</Text>

          <Text style={[styles.metaLine, { color: theme.textSecondary }]}>
            Generated {formatIsoDate(overview.generatedAt.slice(0, 10))} · {overview.model}
          </Text>

          {orderedActivities.length > 0 ? (
            <View style={styles.orderBlock}>
              <Text style={[styles.orderTitle, { color: theme.textPrimary }]}>
                Recommended order
              </Text>
              {rationale ? (
                <Text style={[styles.rationale, { color: theme.textSecondary }]}>
                  {rationale}
                </Text>
              ) : null}
              {orderedActivities.map((activity, idx) => (
                <OrderedStepRow
                  key={activity.id}
                  index={idx}
                  total={orderedActivities.length}
                  activity={activity}
                  category={categoryById.get(activity.categoryId) ?? null}
                />
              ))}
            </View>
          ) : (
            // Gemini can return 0 valid IDs (sanitisation dropped everything
            // — e.g. model hallucinated IDs). Surface a soft notice rather
            // than leaving the user staring at a content-only response.
            <View
              style={[styles.infoRow, { backgroundColor: theme.tagBackground }]}
              accessibilityLiveRegion="polite"
            >
              <Ionicons name="information-circle" size={14} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                No ordered steps returned. Try regenerating for a suggested path.
              </Text>
            </View>
          )}
        </>
      ) : (
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Tap below to ask Gemini for a trip overview and a recommended order to tackle
          your activities. Your activities, dates, and notes stay local — only the
          content needed to build the guide is sent to the API.
        </Text>
      )}

      {error ? (
        <ErrorBanner
          kind={errorKind}
          message={friendlyMessage(errorKind, error, isCoolingDown, remainingSeconds)}
          theme={theme}
        />
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleGeneratePress}
          disabled={isGenerating || isCoolingDown}
          accessibilityRole="button"
          accessibilityLabel={
            isCoolingDown
              ? `Rate limited. Try again in ${remainingSeconds} seconds`
              : primaryLabel
          }
          accessibilityState={{
            disabled: isGenerating || isCoolingDown,
            busy: isGenerating,
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: Palette.aiViolet },
            (isGenerating || pressed) && styles.primaryBtnPressed,
            isCoolingDown && styles.primaryBtnDisabled,
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color={Palette.white} />
          ) : isCoolingDown ? (
            <>
              <Ionicons name="time-outline" size={16} color={Palette.white} />
              <Text style={styles.primaryBtnText}>
                Try again in {remainingSeconds}s
              </Text>
            </>
          ) : (
            <>
              <Ionicons name={primaryIcon} size={16} color={Palette.white} />
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </>
          )}
        </Pressable>

        {overview && onClear ? (
          <Pressable
            onPress={handleClearPress}
            disabled={isGenerating}
            accessibilityRole="button"
            accessibilityLabel="Clear AI overview"
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: theme.cardBorder },
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Ionicons name="trash-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Map a `(errorKind, rawMessage)` pair to the actual copy the user sees.
 * The rate-limit branch prefers a live "Try again in Xs" string that
 * ticks down as the card re-renders. Other kinds fall through to the
 * service layer's already-friendly message text.
 */
function friendlyMessage(
  kind: GeminiErrorKind | null,
  message: string,
  isCoolingDown: boolean,
  remainingSeconds: number,
): string {
  if (kind === 'rate-limit' && isCoolingDown) {
    return `Gemini\u2019s rate limit was hit. Try again in ${remainingSeconds}s.`;
  }
  return message;
}

/**
 * Error row — one-liner that adapts tone + icon to the kind of failure.
 * Kept as a separate component so the main card body stays readable.
 */
function ErrorBanner({
  kind,
  message,
  theme,
}: {
  kind: GeminiErrorKind | null;
  message: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const icon = iconForKind(kind);
  return (
    <View
      style={[styles.errorRow, { backgroundColor: theme.tagBackground }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon} size={14} color={Palette.coral} />
      <Text style={[styles.errorText, { color: Palette.coral }]}>{message}</Text>
    </View>
  );
}

function iconForKind(kind: GeminiErrorKind | null): 'time-outline' | 'key-outline' | 'cloud-offline-outline' | 'warning-outline' {
  if (kind === 'rate-limit') return 'time-outline';
  if (kind === 'auth' || kind === 'missing-key') return 'key-outline';
  if (kind === 'network') return 'cloud-offline-outline';
  return 'warning-outline';
}

// memo() at the export boundary — parent InsightsSection re-renders on every
// chart interaction (viewMode toggle etc), but the AI card's props only
// change when overview data actually shifts. Skip renders otherwise.
export default memo(AiOverviewCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaLine: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: Spacing.sm,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 13,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  orderBlock: {
    marginTop: Spacing.md,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  rationale: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
  },
  errorRow: {
    alignItems: 'flex-start',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  // Cooldown state — keep the violet tint but dim the button heavily so it
  // reads as non-actionable without losing the brand colour association.
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  secondaryBtnPressed: {
    opacity: 0.7,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
