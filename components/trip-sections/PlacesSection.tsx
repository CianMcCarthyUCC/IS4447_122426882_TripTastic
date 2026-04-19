import { useEffect, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { useCategories } from '@/hooks';
import { usePlaces } from '@/hooks/usePlaces';
import { useMountedRef } from '@/hooks/useMountedRef';
import { FilterChips } from '@/components/forms';
import { PlaceCard } from '@/components/cards';
import { EmptyState, PlaneLoader } from '@/components/feedback';
import { SharedStyles } from '@/constants';
import { geocodeCity } from '@/utils/geocode';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { Place } from '@/utils/geoapify';

type Props = {
  destination: string;
  country: string;
};

const EMPTY_PLACES: Place[] = [];

/**
 * Places section of the trip detail screen — geocodes the destination once,
 * then renders a filterable list of nearby POIs via the Geoapify hook.
 *
 * The FilterChips row lives inside the FlatList's `ListHeaderComponent`
 * so the entire section shares one scroll surface — a drag on the chip
 * row is in-bounds for the list's pan gesture. Non-populated states
 * (no geocode / loading / error / zero places) are handled via
 * `ListEmptyComponent` against an empty data array, so the chip row
 * still renders above them and the same scroll contract holds.
 */
export function PlacesSection({ destination, country }: Props) {
  const { categories } = useCategories();
  const mounted = useMountedRef();
  const [tripCoords, setTripCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<string>('all');

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

  const placeCategoryIds = useMemo(
    () => (selectedPlaceCategory === 'all' ? [] : [Number(selectedPlaceCategory)]),
    [selectedPlaceCategory],
  );

  const {
    places,
    loading: placesLoading,
    error: placesError,
  } = usePlaces({
    lat: tripCoords?.lat,
    lon: tripCoords?.lon,
    categoryIds: placeCategoryIds,
  });

  const categoryChips = useMemo<ChipOption[]>(
    () => [
      { label: 'All', value: 'all' },
      ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
    ],
    [categories],
  );

  const listHeader = useMemo(
    () => (
      <FilterChips
        options={categoryChips}
        selected={selectedPlaceCategory}
        onSelect={setSelectedPlaceCategory}
        accessibilityLabel="Filter places by category"
      />
    ),
    [categoryChips, selectedPlaceCategory],
  );

  // Priority order: missing geocode > loading > error > zero results.
  // All four render via ListEmptyComponent so the FilterChips header
  // stays visible above them without being moved in and out of the DOM.
  const listEmpty =
    tripCoords === null ? (
      <EmptyState
        title="Can't locate destination"
        message={`We couldn't geocode "${destination}". Places need a resolvable city.`}
        showAnimation={false}
      />
    ) : placesLoading ? (
      <PlaneLoader size="medium" message="Loading places…" />
    ) : placesError ? (
      <EmptyState title="Couldn't load places" message={placesError} showAnimation={false} />
    ) : (
      <EmptyState
        title="No places found"
        message="Try another category or check back later."
        showAnimation={false}
      />
    );

  // Drive the FlatList from an empty array while any non-populated state
  // is active. This keeps the header + empty component inside the one
  // scrollable so touches on the chips always route into the scroll
  // surface, matching the Activities / Goals sections.
  const data = tripCoords !== null && !placesLoading && !placesError ? places : EMPTY_PLACES;

  return (
    <FlatList
      data={data}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PlaceCard place={item} categories={categories} />}
      contentContainerStyle={SharedStyles.listContent}
      showsVerticalScrollIndicator={false}
      // Keep parity with the other section lists — dragging dismisses
      // any open keyboard without any press-wrapper intercepting.
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
    />
  );
}
