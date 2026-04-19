import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import { FilterChips } from '@/components/forms';
import { EmptyState, PlaneLoader } from '@/components/feedback';
import { PlaceCard } from '@/components/cards';
import { useCategories, useAppTheme } from '@/hooks';
import { usePlaces } from '@/hooks/usePlaces';
import { Spacing, SharedStyles } from '@/constants';
import { setPickedPlace } from '@/utils/placePickerBridge';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type { Place } from '@/utils/geoapify';

/**
 * Modal route: `/place-picker?lat=...&lon=...`
 * Lists nearby POIs via Geoapify and lets the user pick one. On select,
 * the chosen Place is stashed in the module-level bridge and the caller
 * (Activity add) consumes it on the next focus.
 */
export default function PlacePickerScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { categories } = useCategories();

  const { lat, lon } = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const latNum = lat !== undefined ? Number(lat) : undefined;
  const lonNum = lon !== undefined ? Number(lon) : undefined;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryIds = useMemo(
    () => (selectedCategory === 'all' ? [] : [Number(selectedCategory)]),
    [selectedCategory],
  );

  const { places, loading, error } = usePlaces({
    lat: latNum,
    lon: lonNum,
    categoryIds,
  });

  const categoryChips = useMemo<ChipOption[]>(
    () => [
      { label: 'All', value: 'all' },
      ...categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
    ],
    [categories],
  );

  const handleSelect = (place: Place) => {
    setPickedPlace(place);
    router.back();
  };

  const missingCoords = latNum === undefined || lonNum === undefined;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Pick a place</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Nearby points of interest around your trip destination.
      </Text>

      <FilterChips
        options={categoryChips}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        accessibilityLabel="Filter places by category"
      />

      {missingCoords ? (
        <EmptyState
          title="No destination coordinates"
          message="We couldn't resolve the trip destination to a location."
          showAnimation={false}
        />
      ) : loading ? (
        <PlaneLoader size="medium" message="Loading places…" />
      ) : error ? (
        <EmptyState title="Couldn't load places" message={error} showAnimation={false} />
      ) : places.length === 0 ? (
        <EmptyState
          title="No places found"
          message="Try a different category or widen the search."
          showAnimation={false}
        />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} categories={categories} onPress={handleSelect} />
          )}
          contentContainerStyle={SharedStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
});
