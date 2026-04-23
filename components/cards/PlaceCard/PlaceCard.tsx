import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';
import { CategoryIcon } from '@/components/cards/CategoryIcon';
import type { Place } from '@/utils/geoapify';
import type { Category } from '@/types';

type Props = {
  place: Place;
  categories: Category[];
  onPress?: (place: Place) => void;
};

/**
 * A horizontal card for a single place of interest. Used on the trip's
 * Places tab and inside the place-picker. Shows the place name, address
 * and a tinted category icon so each row is easy to scan.
 */
function PlaceCard({ place, categories, onPress }: Props) {
  const theme = useAppTheme();
  const categoryLookup = useCategoryLookup(categories);
  const category = categoryLookup.get(place.categoryId);
  const categoryName = category?.name ?? 'Place';
  const color = category?.color ?? Palette.navy;
  // Fall back to a location glyph when the place maps to no known
  // category (Geoapify returns a type we don't stock in the local DB).
  const badgeCategory = category ?? { icon: 'location', color };

  const handlePress = () => onPress?.(place);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.cardBorder },
        pressed && onPress && styles.pressed,
      ]}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${place.name}, ${categoryName}`}
      accessibilityHint={onPress ? 'Select this place' : undefined}
    >
      <CategoryIcon category={badgeCategory} variant="bubble" size={36} />

      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.metaRow}>
          <CategoryIcon category={badgeCategory} size={14} />
          <Text style={[styles.meta, { color: theme.textSecondary, marginLeft: Spacing.xs }]}>{categoryName}</Text>
        </View>
        {place.address ? (
          <Text style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>
            {place.address}
          </Text>
        ) : null}
      </View>

      {onPress ? (
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default memo(PlaceCard);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
