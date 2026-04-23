import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useCategories, useHaptics, useTrips, useTripScopedData } from '@/hooks';
import { useFilteredActivities } from '@/hooks/useFilteredData';
import { TripHero } from '@/components/cards';
import { FiltersPill, QuickFilterChip, SearchBar, SearchableListPicker } from '@/components/forms';
import type { SearchableOption } from '@/components/forms';
import { ActivityCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig } from '@/components/modals';
import { Spacing } from '@/constants';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { Category } from '@/types';

/**
 * The Past Trip scrapbook. A read-only look back on a finished trip,
 * with a flat summary strip, highlight rows for top category, longest
 * day and trip span, and a filterable activity recap (search, category,
 * favourites-only, sort direction) - mirroring the planned trip's
 * filter pattern but trimmed to what is useful once a trip is done.
 */
export default function PastTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { findTripById } = useTrips();
  const { categories } = useCategories();

  const tripId = Number(id);
  const trip = findTripById(tripId);
  const haptics = useHaptics();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { activities, completedCount, totalMinutes } = useTripScopedData(tripId);

  // Reuse the shared filter pipeline from the planned Activities section
  // so the past-trip recap inherits the same search / sort / favourites
  // semantics without duplicating the filter logic.
  const {
    filtered,
    searchQuery,
    selectedCategory,
    favouritesOnly,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setFavouritesOnly,
    setSortDirection,
    resetFilters,
    isFiltered,
  } = useFilteredActivities(activities, categories);

  // Default the recap to newest-first on mount so the reading order
  // matches "what did we do last?". The user can still flip it via
  // the sort chip; we only force it once on first render.
  const didInitSort = useRef(false);
  useEffect(() => {
    if (!didInitSort.current) {
      didInitSort.current = true;
      setSortDirection('desc');
    }
  }, [setSortDirection]);

  const categoryById = useMemo(
    () => new Map<number, Category>(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Option list for the Category drill-down. Mirrors the shape used by
  // the planned Activities section so both surfaces share one picker.
  const categoryOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All categories', value: 'all', icon: 'apps-outline' },
      ...categories.map((c) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
        icon: c.icon as SearchableOption['icon'],
      })),
    ],
    [categories],
  );

  const categoryLabelFor = (v: string) =>
    v === 'all'
      ? 'All categories'
      : categories.find((c) => String(c.id) === v)?.name ?? 'All categories';

  const sheetFilters = useMemo<DrillDownFilterConfig[]>(
    () => [
      {
        key: 'category',
        icon: 'pricetag-outline',
        label: 'Category',
        subViewTitle: 'Category',
        value: selectedCategory,
        defaultValue: 'all',
        describe: (v) => categoryLabelFor(v as string),
        isActive: (v) => (v as string) !== 'all',
        onApply: (v) => setSelectedCategory(v as string),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={categoryOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v);
              close();
            }}
            searchPlaceholder="Search categories"
            accessibilityLabel="Filter by category"
          />
        ),
      },
    ],
    [categoryOptions, selectedCategory, categories, setSelectedCategory],
  );

  const appliedFilterCount = selectedCategory !== 'all' ? 1 : 0;

  // Computed highlights for the flat recap rows. Each entry returns
  // null when there is not enough data to say something meaningful.
  const highlights = useMemo(() => {
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

    const categoriesTouched = new Set(activities.map((a) => a.categoryId)).size;

    return { topCategory, longestDay, categoriesTouched };
  }, [activities, categoryById]);

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
      {/* Hero sits outside the ScrollView so it stays pinned at the top
          while the recap below scrolls, matching the planned trip layout. */}
      <TripHero
        trip={trip}
        completedCount={completedCount}
        totalCount={activities.length}
        onBack={handleBack}
        onSettings={() =>
          router.push({ pathname: '/trip/[id]/edit', params: { id: trip.id.toString() } })
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Flat summary strip - hairline dividers between cells, no card chrome. */}
          <View style={[styles.summary, { borderColor: theme.cardBorder }]}>
            <SummaryCell value={String(completedCount)} label="Activities" theme={theme} />
            <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
            <SummaryCell value={formatMinutes(totalMinutes)} label="Time spent" theme={theme} />
            <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
            <SummaryCell
              value={String(highlights.categoriesTouched)}
              label="Categories"
              theme={theme}
            />
          </View>

          {/* Flat Highlights block - no card background, rows sit directly on the screen. */}
          {activities.length > 0 ? (
            <View style={styles.highlightsBlock}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Highlights</Text>

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
                  meta={`${highlights.longestDay.count} activities \u00b7 ${formatMinutes(highlights.longestDay.minutes)}`}
                  theme={theme}
                />
              ) : null}

              <HighlightRow
                icon="calendar"
                iconColor={theme.textSecondary}
                label="Trip span"
                value={`${formatIsoDate(trip.startDate)} - ${formatIsoDate(trip.endDate)}`}
                meta={null}
                theme={theme}
              />
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, styles.recapTitle, { color: theme.textPrimary }]}>
            Activity recap
          </Text>

          {/* Shared filter surface: search + category chips + favourites / sort chips. */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search activities..."
            suggestions={categories.slice(0, 4).map((c) => c.name)}
          />
          <View style={styles.quickRow}>
            <QuickFilterChip
              label="Favourites"
              icon={favouritesOnly ? 'heart' : 'heart-outline'}
              active={favouritesOnly}
              onPress={() => setFavouritesOnly(!favouritesOnly)}
              accessibilityLabel={
                favouritesOnly ? 'Show all activities' : 'Show favourites only'
              }
            />
            <QuickFilterChip
              label={sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
              icon="swap-vertical-outline"
              active={sortDirection === 'asc'}
              onPress={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              accessibilityLabel={`Sort by date ${sortDirection === 'desc' ? 'newest first' : 'oldest first'}, tap to flip`}
            />
            <FiltersPill activeCount={appliedFilterCount} onPress={() => setSheetOpen(true)} />
            {isFiltered ? (
              <QuickFilterChip
                label="Clear"
                icon="close-circle-outline"
                active
                onPress={resetFilters}
                accessibilityLabel="Clear all filters"
              />
            ) : null}
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              title={isFiltered ? 'No matches' : 'No activities logged'}
              message={
                isFiltered
                  ? 'Try another category or clear your filters.'
                  : 'This trip wrapped up without any activities logged.'
              }
              actionLabel={isFiltered ? 'Clear filters' : undefined}
              onAction={isFiltered ? resetFilters : undefined}
              showAnimation={false}
            />
          ) : (
            // Render cards directly via map rather than through ActivityList
            // (which uses a FlatList) so the list can live inside this
            // screen's outer ScrollView without tripping React Native's
            // "VirtualizedLists nested inside ScrollViews" warning.
            // Read-only: no onToggleFavourite so the star control stays
            // hidden on this recap screen.
            filtered.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                category={categoryById.get(activity.categoryId)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
      />
    </SafeAreaView>
  );
}

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
          <Text style={[styles.highlightMeta, { color: theme.textSecondary }]}>{meta}</Text>
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
  // Flat summary strip - hairline top + bottom borders, no card background.
  summary: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
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
  highlightsBlock: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: Spacing.sm,
  },
  recapTitle: {
    marginTop: Spacing.xl,
  },
  highlightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  highlightIcon: {
    alignItems: 'center',
    borderRadius: 999,
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
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});

