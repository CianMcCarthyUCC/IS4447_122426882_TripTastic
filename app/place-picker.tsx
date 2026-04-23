import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout';
import {
  FiltersPill,
  QuickFilterChip,
  SearchBar,
  SearchableListPicker,
} from '@/components/forms';
import type { SearchableOption } from '@/components/forms';
import { EmptyState, PlaneLoader } from '@/components/feedback';
import { PlaceCard } from '@/components/cards';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig } from '@/components/modals';
import { useAppTheme, useCategories, useFilteredPlaces } from '@/hooks';
import { usePlaces } from '@/hooks/usePlaces';
import { BorderRadius, SharedStyles, Spacing } from '@/constants';
import { setPickedPlace } from '@/utils/placePickerBridge';
import type { Place } from '@/utils/geoapify';

/**
 * The Pick a Place modal. Shown from the Activity form so the user can
 * attach a real nearby place to what they did. Shares the same search
 * and filter set-up as the Places tab inside a trip.
 */
export default function PlacePickerScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { categories } = useCategories();

  const { lat, lon } = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const latNum = lat !== undefined ? Number(lat) : undefined;
  const lonNum = lon !== undefined ? Number(lon) : undefined;
  const [sheetOpen, setSheetOpen] = useState(false);

  // The upstream Geoapify fetch is unfiltered so we can re-use its
  // result across every category/sort change without another network
  // round-trip; all client filtering happens below in
  // `useFilteredPlaces`.
  const { places, loading, error } = usePlaces({
    lat: latNum,
    lon: lonNum,
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

  const handleSelect = (place: Place) => {
    setPickedPlace(place);
    router.back();
  };

  const missingCoords = latNum === undefined || lonNum === undefined;

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Pick a place to add</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Nearby points of interest around your trip destination.
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        >
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search places…"
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
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No places found"
          message={isFiltered ? 'Try a different search or category.' : 'Try a different category or widen the search.'}
          actionLabel={isFiltered ? 'Clear filters' : undefined}
          onAction={isFiltered ? resetFilters : undefined}
          showAnimation={false}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} categories={categories} onPress={handleSelect} />
          )}
          contentContainerStyle={SharedStyles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}
      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  closeBtn: {
    borderRadius: BorderRadius.pill,
    padding: Spacing.xs,
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
