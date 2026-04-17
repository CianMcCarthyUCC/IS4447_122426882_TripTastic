import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getRecentSearches, insertRecentSearch, clearRecentSearches } from '@/db';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Example searches shown when empty + focused */
  suggestions?: string[];
};

/**
 * Search bar with recent searches (SQLite-persisted), suggestions,
 * and animated dropdown. Provides rich feedback when no query entered.
 */
function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  suggestions = ['Sightseeing', 'Museum', 'Restaurant', 'Hiking'],
}: Props) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (focused) {
      void getRecentSearches(5).then((rows) =>
        setRecents(rows.map((r) => r.query)),
      );
    }
  }, [focused]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      void insertRecentSearch(value.trim());
    }
    setFocused(false);
  }, [value]);

  const handleSuggestionPress = useCallback(
    (text: string) => {
      onChangeText(text);
      void insertRecentSearch(text);
      setFocused(false);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const handleClearRecents = useCallback(() => {
    void clearRecentSearches();
    setRecents([]);
  }, []);

  const showDropdown = focused && !value;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            blurTimeout.current = setTimeout(() => setFocused(false), 200);
          }}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          accessibilityLabel="Search"
          accessibilityHint={placeholder}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {showDropdown && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.dropdown, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        >
          {recents.length > 0 && (
            <>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: theme.textSecondary }]}>Recent</Text>
                <Pressable onPress={handleClearRecents} accessibilityLabel="Clear recent searches" accessibilityRole="button">
                  <Text style={[styles.clearText, { color: theme.accentAction }]}>Clear</Text>
                </Pressable>
              </View>
              {recents.map((q) => (
                <View key={q}>
                  <Pressable style={styles.dropdownItem} onPress={() => handleSuggestionPress(q)} accessibilityLabel={`Search for ${q}`} accessibilityRole="button">
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.dropdownItemText, { color: theme.textPrimary }]}>{q}</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <Text style={[styles.dropdownTitle, { color: theme.textSecondary, marginTop: recents.length > 0 ? Spacing.md : 0 }]}>
            Try searching
          </Text>
          {suggestions.map((s) => (
            <Pressable key={s} style={styles.dropdownItem} onPress={() => handleSuggestionPress(s)} accessibilityLabel={`Try searching ${s}`} accessibilityRole="button">
              <Ionicons name="search-outline" size={16} color={theme.accentAction} />
              <Text style={[styles.dropdownItemText, { color: theme.textPrimary }]}>{s}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

export default memo(SearchBar);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  container: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  dropdown: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
    padding: Spacing.md,
    ...Shadows.md,
  },
  dropdownHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  dropdownItemText: {
    fontSize: 15,
  },
});
