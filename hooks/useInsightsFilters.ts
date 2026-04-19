import { useCallback, useMemo, useState } from 'react';
import { useActivityContext, useCategoryContext, useTripContext } from '@/context';
import { useDebouncedValue } from './useDebouncedValue';
import { countryToContinent } from '@/utils/continent';
import { dateRangeBounds } from '@/utils/dateRangeFilter';
import type { Continent } from '@/utils/continent';
import type { DateRange } from '@/utils/dateRangeFilter';
import type { Activity, ActivityStatus, Category, Trip } from '@/types';

export type InsightsStatus = 'all' | ActivityStatus;
export type InsightsDateRange = DateRange;
export type InsightsTripId = number | 'all';
export type InsightsContinent = 'all' | Continent;
export type InsightsCountry = 'all' | string;

type InsightsFilterState = {
  searchQuery: string;
  selectedCategoryId: number | 'all';
  status: InsightsStatus;
  dateRange: InsightsDateRange;
  // YYYY-MM-DD bounds — only used when dateRange === 'custom'. Kept as
  // strings to match the activities table's date format for direct
  // string-slice comparison in the filter predicate.
  customStartDate: string | null;
  customEndDate: string | null;
  tripId: InsightsTripId;
  continent: InsightsContinent;
  country: InsightsCountry;
};

const DEFAULT_STATE: InsightsFilterState = {
  searchQuery: '',
  selectedCategoryId: 'all',
  status: 'all',
  dateRange: 'all',
  customStartDate: null,
  customEndDate: null,
  tripId: 'all',
  continent: 'all',
  country: 'all',
};

/**
 * Central filter hook for the Insights screen. Owns the full filter
 * state + derives the filtered activity list.
 *
 * The search query is internally debounced (300ms) so the downstream
 * chart memos don't re-compute on every keystroke. `searchQuery` (the
 * input-facing setter value) is returned so the UI stays responsive;
 * `filteredActivities` re-computes off the debounced value.
 */
export function useInsightsFilters() {
  const { activities } = useActivityContext();
  const { categories } = useCategoryContext();
  const { trips } = useTripContext();

  const [state, setState] = useState<InsightsFilterState>(DEFAULT_STATE);
  const debouncedQuery = useDebouncedValue(state.searchQuery, 300);

  // Lookup table for category names — joins into the search match so
  // the user can search "food" and hit all activities in the Food
  // category, not just ones whose notes mention food.
  const categoryById = useMemo(
    () => new Map<number, Category>(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Activities don't store country directly — we resolve
  // activity.tripId → Trip.country → continent for location filters.
  const tripById = useMemo(
    () => new Map<number, Trip>((trips as Trip[]).map((t) => [t.id, t])),
    [trips],
  );

  // Surfaced to the UI so the sub-screens only offer options the user's
  // actual trip set contains — no dead chips.
  const availableCountries = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const t of trips as Trip[]) if (t.country) set.add(t.country);
    return Array.from(set).sort();
  }, [trips]);

  const availableContinents = useMemo<Continent[]>(() => {
    const set = new Set<Continent>();
    for (const c of availableCountries) set.add(countryToContinent(c));
    return Array.from(set);
  }, [availableCountries]);

  const filteredActivities = useMemo<Activity[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();

    // Pre-compute date bounds once per memo, not per activity. Semantics
    // (week = 7 days inclusive of today, month = 30 days inclusive,
    // custom auto-swaps inverted ranges) live in the shared utility.
    const { floor: dateFloor, ceil: dateCeil } = dateRangeBounds(
      state.dateRange,
      state.customStartDate,
      state.customEndDate,
    );

    return activities.filter((a) => {
      if (state.selectedCategoryId !== 'all' && a.categoryId !== state.selectedCategoryId) {
        return false;
      }
      if (state.status !== 'all' && a.status !== state.status) {
        return false;
      }
      if (state.tripId !== 'all' && a.tripId !== state.tripId) {
        return false;
      }
      // Location filters resolve through the activity's trip. An activity
      // whose tripId points to a missing trip gets filtered out whenever
      // a location filter is active — treat orphans as "no location".
      if (state.continent !== 'all' || state.country !== 'all') {
        const trip = tripById.get(a.tripId);
        if (!trip) return false;
        if (state.country !== 'all' && trip.country !== state.country) return false;
        if (
          state.continent !== 'all' &&
          countryToContinent(trip.country) !== state.continent
        ) {
          return false;
        }
      }
      if (dateFloor && a.date < dateFloor) {
        return false;
      }
      if (dateCeil && a.date > dateCeil) {
        return false;
      }
      if (q.length > 0) {
        const notes = a.notes?.toLowerCase() ?? '';
        const catName = categoryById.get(a.categoryId)?.name.toLowerCase() ?? '';
        if (!notes.includes(q) && !catName.includes(q)) return false;
      }
      return true;
    });
  }, [activities, categoryById, tripById, debouncedQuery, state]);

  // Count of filters currently deviating from the default state — drives
  // the "Filters · N" badge on the secondary-filter button in the UI.
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (state.selectedCategoryId !== 'all') n++;
    if (state.status !== 'all') n++;
    if (state.dateRange !== 'all') n++;
    if (state.tripId !== 'all') n++;
    if (state.continent !== 'all') n++;
    if (state.country !== 'all') n++;
    return n;
  }, [state]);

  // Is ANY filter (including search) active? Used to decide whether to
  // show the "no results" empty state vs. the "no activities at all"
  // empty state.
  const isFiltered = activeFilterCount > 0 || state.searchQuery.trim().length > 0;

  // Individual setters kept explicit rather than exposing the whole
  // reducer — caller code reads better as `setStatus('completed')` than
  // `dispatch({ type: 'setStatus', value: 'completed' })`.
  const setSearchQuery = useCallback((v: string) => setState((s) => ({ ...s, searchQuery: v })), []);
  const setSelectedCategoryId = useCallback(
    (v: number | 'all') => setState((s) => ({ ...s, selectedCategoryId: v })),
    [],
  );
  const setStatus = useCallback((v: InsightsStatus) => setState((s) => ({ ...s, status: v })), []);
  const setDateRange = useCallback(
    (v: InsightsDateRange) =>
      setState((s) => ({
        ...s,
        dateRange: v,
        // Leaving 'custom' wipes the bounds so they don't silently
        // resurface if the user taps 'custom' again later.
        customStartDate: v === 'custom' ? s.customStartDate : null,
        customEndDate: v === 'custom' ? s.customEndDate : null,
      })),
    [],
  );
  const setCustomDateRange = useCallback(
    (start: string | null, end: string | null) =>
      setState((s) => ({
        ...s,
        dateRange: 'custom',
        customStartDate: start,
        customEndDate: end,
      })),
    [],
  );
  const setTripId = useCallback((v: InsightsTripId) => setState((s) => ({ ...s, tripId: v })), []);
  const setContinent = useCallback(
    (v: InsightsContinent) => setState((s) => ({ ...s, continent: v })),
    [],
  );
  const setCountry = useCallback(
    (v: InsightsCountry) => setState((s) => ({ ...s, country: v })),
    [],
  );
  const clearAll = useCallback(() => setState(DEFAULT_STATE), []);

  return {
    // State
    searchQuery: state.searchQuery,
    selectedCategoryId: state.selectedCategoryId,
    status: state.status,
    dateRange: state.dateRange,
    customStartDate: state.customStartDate,
    customEndDate: state.customEndDate,
    tripId: state.tripId,
    continent: state.continent,
    country: state.country,
    // Setters
    setSearchQuery,
    setSelectedCategoryId,
    setStatus,
    setDateRange,
    setCustomDateRange,
    setTripId,
    setContinent,
    setCountry,
    clearAll,
    // Derived
    filteredActivities,
    activeFilterCount,
    isFiltered,
    availableContinents,
    availableCountries,
    // Context passthroughs — kept here so the consuming screen doesn't
    // re-subscribe to the same contexts separately.
    categories,
    trips: trips as Trip[],
  };
}
