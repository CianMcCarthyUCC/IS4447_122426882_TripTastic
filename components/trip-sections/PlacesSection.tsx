import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useCategories, useFilteredPlaces } from '@/hooks';
import { usePlaces } from '@/hooks/usePlaces';
import { useMountedRef } from '@/hooks/useMountedRef';
import {
  FiltersPill,
  QuickFilterChip,
  SearchBar,
  SearchableListPicker,
} from '@/components/forms';
import type { SearchableOption } from '@/components/forms';
import { PlaceCard } from '@/components/cards';
import { EmptyState, PlaneLoader } from '@/components/feedback';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig } from '@/components/modals';
import { SharedStyles, Spacing } from '@/constants';
import { geocodeCity } from '@/utils/geocode';
import type { Place } from '@/utils/geoapify';

type Props = {
  destination: string;
  country: string;
};

const EMPTY_PLACES: Place[] = [];

/**
 * The Places tab on the trip detail screen. Looks up nearby points of
 * interest around the trip's destination and shows them in a searchable,
 * filterable list so the user can find somewhere to visit.
 */
export function PlacesSection({ destination, country }: Props) {
  const { categories } = useCategories();
  const mounted = useMountedRef();
  const [tripCoords, setTripCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    void (async () => {
      const coords = await geocodeCity(destination, country);
      if (cancelled || !mounted.current) return;
      setTripCoords(coords ? { lat: coords.latitude, lon: coords.longitude } : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [destination, country, mounted]);

  // Fetch unfiltered - client-side filter handles category selection so
  // tapping between categories doesn't refetch and the sort/search
  // remain instant.
  const {
    places,
    loading: placesLoading,
    error: placesError,
  } = usePlaces({
    lat: tripCoords?.lat,
    lon: tripCoords?.lon,
    categoryIds: [],
  });

  const {
    filtered,
    searchQuery,
    selectedCategory,
    sortDirection,
    setSearchQuery,
    setSelectedCategory,
    setSortDirection,
    isFiltered,
    resetFilters,
  } = useFilteredPlaces(places);

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

  const listHeader = useMemo(
    () => (
      <View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search places..."
        />
        <View style={styles.quickRow}>
          <QuickFilterChip
            label={sortDirection === 'asc' ? 'Name A-Z' : 'Name Z-A'}
            icon="swap-vertical-outline"
            active={sortDirection === 'desc'}
            onPress={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            accessibilityLabel={`Sort by name ${sortDirection === 'asc' ? 'A to Z' : 'Z to A'}, tap to flip`}
          />
          <FiltersPill activeCount={appliedFilterCount} onPress={() => setSheetOpen(true)} />
          {isFiltered ? (
            <QuickFilterChip
              label="Clear"
              icon="close-circle-outline"
              active
              onPress={resetFilters}
              accessibilityLabel="Clear search and filters"
            />
          ) : null}
        </View>
      </View>
    ),
    [
      searchQuery,
      setSearchQuery,
      sortDirection,
      setSortDirection,
      appliedFilterCount,
      isFiltered,
      resetFilters,
    ],
  );

  // Priority order: missing geocode > loading > error > zero results.
  // When the user has narrowed the list themselves, swap in a
  // filter-aware empty state so they have a one-tap escape.
  const listEmpty =
    tripCoords === null ? (
      <EmptyState
        title="Can't locate destination"
        message={`We couldn't geocode "${destination}". Places need a resolvable city.`}
        showAnimation={false}
      />
    ) : placesLoading ? (
      <PlaneLoader size="medium" message="Loading places..." />
    ) : placesError ? (
      <EmptyState title="Couldn't load places" message={placesError} showAnimation={false} />
    ) : isFiltered ? (
      <EmptyState
        title="No results"
        message="Try a different search or category."
        actionLabel="Clear filters"
        onAction={resetFilters}
        showAnimation={false}
      />
    ) : (
      <EmptyState
        title="No places found"
        message="Try another category or check back later."
        showAnimation={false}
      />
    );

  const data = tripCoords !== null && !placesLoading && !placesError ? filtered : EMPTY_PLACES;

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PlaceCard place={item} categories={categories} />}
        contentContainerStyle={SharedStyles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
      />
      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
      />
    </>
  );
}

const styles = StyleSheet.create({
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
