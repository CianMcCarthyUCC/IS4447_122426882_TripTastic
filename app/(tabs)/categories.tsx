import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories, useActivities, useAppTheme, useTextFilter } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { CategoryList } from '@/components/lists';
import { SearchBar } from '@/components/forms';
import { FAB } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { Spacing } from '@/constants';
import type { Category } from '@/types';

const searchCategory = (c: Category, q: string) => c.name.toLowerCase().includes(q);

/**
 * Categories tab — uses extracted useTextFilter hook for search.
 */
export default function CategoriesScreen() {
  const router = useRouter();
  const { categories } = useCategories();
  const { activities } = useActivities();
  const theme = useAppTheme();

  const { filtered, searchQuery, setSearchQuery, isFiltered } = useTextFilter(categories, searchCategory);
  const noResults = isFiltered && filtered.length === 0;

  return (
    <ScreenContainer withTabs>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {categories.length > 0
            ? `${categories.length} categories · ${activities.length} activities`
            : 'Create categories to organise activities'}
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search categories..."
        suggestions={categories.slice(0, 4).map((c) => c.name)}
      />

      {noResults ? (
        <EmptyState
          title="No categories found"
          message={`No categories match "${searchQuery}". Try a different name.`}
          suggestions={categories.slice(0, 3).map((c) => c.name)}
          onSuggestionPress={setSearchQuery}
          actionLabel="Clear search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <CategoryList categories={filtered} />
      )}

      <FAB onPress={() => router.push('/category/add')} accessibilityLabel="Add category" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: Spacing.xs },
});
