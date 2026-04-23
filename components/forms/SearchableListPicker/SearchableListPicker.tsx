import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { CategoryIcon } from '@/components/cards/CategoryIcon';

export type SearchableOption = {
  label: string;
  value: string;
  /** Optional icon glyph shown at the start of the row. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional colour used to tint the leading icon (e.g. category colour). */
  color?: string;
  /** Optional emoji shown before the label, for example a country flag. */
  emoji?: string;
};

type Props = {
  options: ReadonlyArray<SearchableOption>;
  /** Currently selected value. A single string since the picker is single-select. */
  selected: string;
  /** Fires when the user taps an option. */
  onSelect: (value: string) => void;
  /** Placeholder shown inside the search field. */
  searchPlaceholder?: string;
  accessibilityLabel?: string;
};

/**
 * A searchable, scrollable list picker used inside the drill-down filter
 * sheet for filters with many options (categories, trips, continents,
 * countries). Shows every option as a row the user can scan and scroll
 * through, with a search bar on top so long lists stay manageable.
 */
function SearchableListPicker({
  options,
  selected,
  onSelect,
  searchPlaceholder = 'Search',
  accessibilityLabel,
}: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View style={styles.wrapper} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.searchRow, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel={`${accessibilityLabel ?? 'Filter'} search`}
        />
      </View>

      {filtered.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          No matches for &quot;{query.trim()}&quot;.
        </Text>
      ) : (
        <View style={styles.listContent}>
          {filtered.map((item) => {
            const active = item.value === selected;
            return (
              <Pressable
                key={item.value}
                onPress={() => {
                  haptics.light();
                  onSelect(item.value);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}${active ? ', selected' : ''}`}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: theme.cardBorder },
                  pressed && styles.rowPressed,
                ]}
              >
                {item.emoji ? (
                  <Text style={styles.emoji}>{item.emoji}</Text>
                ) : item.icon ? (
                  <CategoryIcon
                    category={{ icon: item.icon, color: item.color ?? theme.accentAction }}
                    size={16}
                  />
                ) : null}
                <Text
                  style={[
                    styles.label,
                    {
                      color: active ? Palette.coral : theme.textPrimary,
                      fontWeight: active ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={Palette.coral} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default memo(SearchableListPicker);

const styles = StyleSheet.create({
  wrapper: {},
  searchRow: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: Spacing.sm,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowPressed: { opacity: 0.65 },
  label: {
    flex: 1,
    fontSize: 15,
  },
  emoji: {
    fontSize: 20,
  },
  empty: {
    fontSize: 13,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
});
