import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, BorderRadius, SharedStyles } from '@/constants';
import type { Category } from '@/types';

type Props = {
  label?: string;
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
};

/**
 * Reusable category selector — colored pills the user taps to pick one.
 * Can be used in any form that needs a category reference.
 */
export default function CategoryPicker({
  label = 'Category',
  categories,
  selectedId,
  onSelect,
}: Props) {
  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={SharedStyles.fieldLabel} accessibilityRole="text">{label}</Text>
      <View style={styles.pillRow} accessibilityRole="radiogroup" accessibilityLabel="Select a category">
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.pill, { borderColor: cat.color }, selected && { backgroundColor: cat.color }]}
              onPress={() => onSelect(cat.id)}
              accessibilityRole="radio"
              accessibilityLabel={cat.name}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    borderRadius: BorderRadius.pill,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pillText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: Colors.textButton,
  },
});
