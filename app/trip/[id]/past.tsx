import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useCategories, useTrips, useTripScopedData } from '@/hooks';
import { TripHero } from '@/components/cards';
import { FilterChips } from '@/components/forms';
import { ActivityList } from '@/components/lists';
import { EmptyState } from '@/components/feedback';
import { BorderRadius, Shadows, Spacing } from '@/constants';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { Category } from '@/types';

const STAR_GOLD = '#F5C518';

/**
 * Past-trip recap screen — read-only view of a trip whose end date is in
 * the past. Surfaces the things users care about after the fact:
 *   • A summary strip (activities, total time, categories touched)
 *   • Highlights — favourite ("priority"), top category, longest day,
 *     trip span
 *   • Category filter so the user can narrow the activity feed
 *
 * Explicitly no FAB / edit / delete affordances: this screen is a
 * scrapbook, not a planner. Edits live on `/trip/[id]/activities`.
 */
export default function PastTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { findTripById } = useTrips();
  const { categories } = useCategories();

  const tripId = Number(id);
  const trip = findTripById(tripId);
  const { activities, completedCount, totalMinutes } = useTripScopedData(tripId);

  const [selectedCategoryId, setSelectedCategoryId] = useState<'all' | number>('all');

  // Keep the most recent day at the top — reading order for a recap
  // matches "what did we do last?" more naturally than chronological.
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => b.date.localeCompare(a.date)),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    if (selectedCategoryId === 'all') return sortedActivities;
    return sortedActivities.filter((a) => a.categoryId === selectedCategoryId);
  }, [sortedActivities, selectedCategoryId]);

  const categoryById = useMemo(
    () => new Map<number, Category>(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Computed highlights — each returns null when there's not enough data
  // to say anything meaningful, so the card can skip them gracefully.
  const highlights = useMemo(() => {
    const favourite = activities.find((a) => a.isFavourite) ?? null;

    // Top category by total minutes spent.
    let topCategory: { category: Category; minutes: number } | null = null;
    if (activities.length > 0) {
      const minutesByCat = new Map<number, number>();
      for (const a of activities) {
        minutesByCat.set(a.categoryId, (minutesByCat.get(a.categoryId) ?? 0) + a.metric);
      }
      let bestId = -1;
      let bestMinutes = -1;
      for (const [catId, mins] of minutesByCat) {
        if (mins > bestMinutes) {
          bestMinutes = mins;
          bestId = catId;
        }
      }
      const cat = categoryById.get(bestId);
      if (cat) topCategory = { category: cat, minutes: bestMinutes };
    }

    // Longest single day — sum metric per date, pick the max.
    let longestDay: { date: string; minutes: number; count: number } | null = null;
    if (activities.length > 0) {
      const byDate = new Map<string, { minutes: number; count: number }>();
      for (const a of activities) {
        const entry = byDate.get(a.date) ?? { minutes: 0, count: 0 };
        entry.minutes += a.metric;
        entry.count += 1;
        byDate.set(a.date, entry);
      }
      let bestDate = '';
      let bestMinutes = -1;
      let bestCount = 0;
      for (const [date, entry] of byDate) {
        if (entry.minutes > bestMinutes) {
          bestMinutes = entry.minutes;
          bestDate = date;
          bestCount = entry.count;
        }
      }
      if (bestDate) longestDay = { date: bestDate, minutes: bestMinutes, count: bestCount };
    }

    // Distinct categories touched — used in the summary strip.
    const categoriesTouched = new Set(activities.map((a) => a.categoryId)).size;

    return { favourite, topCategory, longestDay, categoriesTouched };
  }, [activities, categoryById]);

  const categoryChips = useMemo<ChipOption[]>(
    () => [
      { label: 'All', value: 'all' },
      ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
    ],
    [categories],
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!trip) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.screenBackground }]}
        edges={['top', 'bottom']}
      >
        <EmptyState title="Trip not found" message="This trip may have been deleted." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.screenBackground }]}
      edges={['bottom']}
    >
      {/* No press-wrapper — the old Pressable that dismissed the keyboard
          on empty-space taps intercepted pan gestures and stalled scroll
          on non-card areas. Keyboard dismissal is handled by the
          ScrollView's `keyboardDismissMode="on-drag"` below. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
          <TripHero
            trip={trip}
            completedCount={completedCount}
            totalCount={activities.length}
            onBack={handleBack}
          />

          <View style={styles.content}>
            {/* Summary strip — three compact stats. */}
            <View
              style={[
                styles.summary,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <SummaryCell
                value={String(completedCount)}
                label="Activities"
                theme={theme}
              />
              <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
              <SummaryCell
                value={formatMinutes(totalMinutes)}
                label="Time spent"
                theme={theme}
              />
              <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
              <SummaryCell
                value={String(highlights.categoriesTouched)}
                label="Categories"
                theme={theme}
              />
            </View>

            {/* Highlights card — optional rows, skipped when a highlight has
                no data to show (trip with 0 activities, no favourite set). */}
            {activities.length > 0 ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Highlights
                </Text>

                {highlights.favourite ? (
                  <HighlightRow
                    icon="star"
                    iconColor={STAR_GOLD}
                    label="Priority activity"
                    value={highlights.favourite.notes ?? 'Marked as priority'}
                    meta={formatIsoDate(highlights.favourite.date)}
                    theme={theme}
                  />
                ) : null}

                {highlights.topCategory ? (
                  <HighlightRow
                    icon="flame"
                    iconColor={highlights.topCategory.category.color}
                    label="Top category"
                    value={highlights.topCategory.category.name}
                    meta={formatMinutes(highlights.topCategory.minutes)}
                    theme={theme}
                  />
                ) : null}

                {highlights.longestDay ? (
                  <HighlightRow
                    icon="sunny"
                    iconColor={theme.accentAction}
                    label="Longest day"
                    value={formatIsoDate(highlights.longestDay.date)}
                    meta={`${highlights.longestDay.count} activities · ${formatMinutes(highlights.longestDay.minutes)}`}
                    theme={theme}
                  />
                ) : null}

                <HighlightRow
                  icon="calendar"
                  iconColor={theme.textSecondary}
                  label="Trip span"
                  value={`${formatIsoDate(trip.startDate)} — ${formatIsoDate(trip.endDate)}`}
                  meta={null}
                  theme={theme}
                />
              </View>
            ) : null}

            <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
              Activity recap
            </Text>

            <FilterChips
              options={categoryChips}
              selected={selectedCategoryId === 'all' ? 'all' : String(selectedCategoryId)}
              onSelect={(v) => setSelectedCategoryId(v === 'all' ? 'all' : Number(v))}
              accessibilityLabel="Filter activities by category"
            />

            {filteredActivities.length === 0 ? (
              <EmptyState
                title={
                  selectedCategoryId === 'all'
                    ? 'No activities logged'
                    : 'Nothing in this category'
                }
                message={
                  selectedCategoryId === 'all'
                    ? 'This trip wrapped up without any activities logged.'
                    : 'Try another category to see what you got up to.'
                }
                showAnimation={false}
              />
            ) : (
              <ActivityList
                activities={filteredActivities}
                categories={categories}
                // Read-only: no onToggleFavourite so the ActivityCard hides
                // the star control on this screen.
              />
            )}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Local building blocks ────────────────────────────────────────────

type Theme = ReturnType<typeof useAppTheme>;

type SummaryCellProps = {
  value: string;
  label: string;
  theme: Theme;
};

function SummaryCell({ value, label, theme }: SummaryCellProps) {
  return (
    <View style={styles.summaryCell}>
      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

type HighlightRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  meta: string | null;
  theme: Theme;
};

function HighlightRow({ icon, iconColor, label, value, meta, theme }: HighlightRowProps) {
  return (
    <View style={styles.highlightRow} accessibilityRole="summary">
      <View style={[styles.highlightIcon, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.highlightTextCol}>
        <Text style={[styles.highlightLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text
          style={[styles.highlightValue, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {meta ? (
          <Text style={[styles.highlightMeta, { color: theme.textSecondary }]}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  summary: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  summaryCell: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  summaryDivider: {
    height: 28,
    width: 1,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
  },
  highlightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  highlightIcon: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  highlightTextCol: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  highlightMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
});
