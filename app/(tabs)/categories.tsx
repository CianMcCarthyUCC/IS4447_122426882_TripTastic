import { useRouter } from 'expo-router';
import { useCategories } from '@/hooks';
import { PrimaryButton } from '@/components/buttons';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { CategoryList } from '@/components/lists';

/**
 * Categories tab — list all categories with add button.
 */
export default function CategoriesScreen() {
  const router = useRouter();
  const { categories } = useCategories();

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Categories" subtitle={`${categories.length} categories`} />
      <PrimaryButton
        label="Add Category"
        onPress={() => router.push('/category/add')}
      />
      <CategoryList categories={categories} />
    </ScreenContainer>
  );
}
