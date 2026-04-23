import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/buttons';
import { CategoryIcon } from '@/components/cards/CategoryIcon';
import { Spacing, BorderRadius, Shadows } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Category } from '@/types';

type Props = {
  category: Category;
};

/**
 * Card for a single category. Shows its icon, name and colour swatch, and
 * opens the category detail screen on tap.
 */
function CategoryCard({ category }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  const openDetails = useCallback(
    () => router.push({ pathname: '/category/[id]', params: { id: category.id.toString() } }),
    [router, category.id],
  );

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={`Category: ${category.name}`}
    >
      <View style={styles.row}>
        <CategoryIcon category={category} size={18} />
        <Text style={[styles.name, { color: theme.textPrimary, marginLeft: Spacing.sm }]}>
          {category.name}
        </Text>
      </View>
      <PrimaryButton compact label="View" variant="accent" onPress={openDetails} />
    </View>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
});
