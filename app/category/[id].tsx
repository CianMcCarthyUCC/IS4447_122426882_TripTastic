import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useCategories } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

/**
 * Category detail screen — view, edit, or delete a category.
 */
export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, deleteCategory } = useCategories();

  const category = findCategoryById(Number(id));
  if (!category) return null;

  const handleDelete = async () => {
    await deleteCategory(Number(id));
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={category.name} subtitle="Category details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Color" value={category.color} />
        <InfoTag label="Icon" value={category.icon} />
      </View>

      <ButtonGroup>
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: '/category/[id]/edit', params: { id } })}
        />
        <PrimaryButton label="Delete" variant="danger" onPress={handleDelete} />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>
    </ScreenContainer>
  );
}
