import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/buttons';
import { Colors, Spacing, SharedStyles } from '@/constants';
import type { Category } from '@/types';

type Props = {
  category: Category;
};

function CategoryCard({ category }: Props) {
  const router = useRouter();

  const openDetails = useCallback(
    () => router.push({ pathname: '/category/[id]', params: { id: category.id.toString() } }),
    [router, category.id],
  );

  return (
    <View style={SharedStyles.card} accessibilityRole="summary" accessibilityLabel={`Category: ${category.name}`}>
      <Pressable onPress={openDetails} accessibilityRole="link" accessibilityHint="View category details">
        <View style={styles.row}>
          <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
          <Text style={styles.name}>{category.name}</Text>
        </View>
      </Pressable>
      <Text style={styles.icon} accessibilityLabel={`Icon: ${category.icon}`}>{category.icon}</Text>
      <PrimaryButton compact label="View" onPress={openDetails} />
    </View>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  icon: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
