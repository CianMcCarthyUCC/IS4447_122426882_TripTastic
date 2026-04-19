import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, SharedStyles, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';
import type { Place } from '@/utils/geoapify';
import type { Category } from '@/types';

type Props = {
  place: Place;
  categories: Category[];
  onPress?: (place: Place) => void;
};

/**
 * Row-style card showing a Geoapify POI with its mapped app category colour.
 * Used by the trip Places segment and the place-picker modal.
 */
function PlaceCard({ place, categories, onPress }: Props) {
  const theme = useAppTheme();
  const categoryLookup = useCategoryLookup(categories);
  const category = categoryLookup.get(place.categoryId);
  const categoryName = category?.name ?? 'Place';
  const color = category?.color ?? Palette.navy;

  const handlePress = () => onPress?.(place);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        pressed && onPress && styles.pressed,
      ]}
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${place.name}, ${categoryName}`}
      accessibilityHint={onPress ? 'Select this place' : undefined}
    >
      <View style={[styles.iconBubble, { backgroundColor: color }]}>
        <Ionicons name="location" size={18} color={Palette.white} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[SharedStyles.colorDot, { backgroundColor: color }]} />
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{categoryName}</Text>
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
  card: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
