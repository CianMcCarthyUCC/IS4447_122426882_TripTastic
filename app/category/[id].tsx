import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useCategories, useDeleteWithConfirm } from '@/hooks';
import { InfoTag } from '@/components/tags';
import { NotFoundFallback } from '@/components/feedback';
import { EntityDetailScreen } from '@/components/layout';
import { SharedStyles } from '@/constants';

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, deleteCategory } = useCategories();

  const category = findCategoryById(Number(id));

  const deleteState = useDeleteWithConfirm(
    () => deleteCategory(Number(id)),
    'Category deleted',
  );

  if (!category) {
    return <NotFoundFallback subtitle="This category may have been deleted." onBack={() => router.back()} />;
  }

  return (
    <EntityDetailScreen
      title={category.name}
      onEdit={() => router.push({ pathname: '/category/[id]/edit', params: { id } })}
      deleteState={deleteState}
      deleteDialog={{
        title: 'Delete Category',
        message: 'Are you sure you want to delete this category? Activities using it may lose their category reference.',
      }}
    >
      <View style={SharedStyles.tagRow}>
        <InfoTag icon="color-palette-outline" label="Colour" value={category.color} />
        <InfoTag icon="shapes-outline" label="Icon" value={category.icon} />
      </View>
    </EntityDetailScreen>
  );
}
