import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/buttons';
import { Spacing, BorderRadius, Shadows, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Category } from '@/types';

type Props = {
  category: Category;
};

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
        <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
        <Text style={[styles.name, { color: theme.textPrimary }]}>{category.name}</Text>
      </View>
      <Text style={[styles.icon, { color: theme.textSecondary }]} accessibilityLabel={`Icon: ${category.icon}`}>
        {category.icon}
      </Text>
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
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  icon: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
