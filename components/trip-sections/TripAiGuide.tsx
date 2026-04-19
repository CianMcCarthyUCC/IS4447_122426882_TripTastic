import { useCallback } from 'react';
import { useAiOverview, useCategories } from '@/hooks';
import { AiOverviewCard } from '@/components/cards';
import type { Activity, Trip } from '@/types';

type Props = {
  trip: Trip;
  /** Trip-scoped activity list — passed down verbatim to the Gemini prompt. */
  activities: Activity[];
};

/**
 * Composite that wires the `useAiOverview` hook to the `AiOverviewCard`.
 * Extracted so the parent Summary section stays focused on chart layout
 * and doesn't need to know about Gemini / haptics / cache state at all.
 *
 * Having this shell also means the feature can be reused elsewhere
 * (e.g. a future trip-settings screen) without duplicating the hook
 * plumbing.
 */
export function TripAiGuide({ trip, activities }: Props) {
  const { categories } = useCategories();
  const {
    overview,
    isLoading,
    isGenerating,
    error,
    errorKind,
    retryAt,
    rationale,
    configured,
    generate,
    clear,
  } = useAiOverview(trip.id);

  const handleGenerate = useCallback(
    () => generate(trip, activities, categories),
    [generate, trip, activities, categories],
  );

  const handleClear = useCallback(() => clear(trip.id), [clear, trip.id]);

  return (
    <AiOverviewCard
      overview={overview}
      activities={activities}
      categories={categories}
      isLoading={isLoading}
      isGenerating={isGenerating}
      error={error}
      errorKind={errorKind}
      retryAt={retryAt}
      rationale={rationale}
      configured={configured}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  );
}
