import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { SavedFilter } from '@/hooks/useSavedFilters';

type Props = {
  filters: SavedFilter[];
  onApply: (filter: SavedFilter) => void;
  onRemove: (id: number) => void;
};

/**
 * Horizontal bar showing saved filters as tappable chips.
 * Tap to apply, long-press X to remove. Persisted to SQLite.
 */
function SavedFiltersBar({ filters, onApply, onRemove }: Props) {
  const theme = useAppTheme();

  if (filters.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <View style={styles.header}>
        <Ionicons name="bookmark" size={14} color={theme.accentAction} />
        <Text style={[styles.headerText, { color: theme.textSecondary }]}>Saved Filters</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {filters.map((f) => (
          <View key={f.id} style={[styles.chip, { backgroundColor: theme.tagBackground }]}>
            <Pressable onPress={() => onApply(f)} style={styles.chipContent}>
              <Ionicons name="bookmark" size={12} color={theme.accentAction} />
              <Text style={[styles.chipText, { color: theme.textPrimary }]}>{f.name}</Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(f.id)}
              hitSlop={8}
              accessibilityLabel={`Remove ${f.name} filter`}
            >
              <Ionicons name="close" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

export default memo(SavedFiltersBar);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scroll: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingRight: Spacing.lg,
  },
  chip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
