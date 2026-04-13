import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useCategories, useDeleteWithConfirm } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, deleteCategory } = useCategories();

  const category = findCategoryById(Number(id));

  const { loading, confirmVisible, showConfirm, cancelConfirm, handleDelete, toast, hideToast } =
    useDeleteWithConfirm(() => deleteCategory(Number(id)), 'Category deleted');

  if (!category) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Not Found" subtitle="This category may have been deleted." />
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title={category.name} subtitle="Category details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Color" value={category.color} />
        <InfoTag label="Icon" value={category.icon} />
      </View>

      <ButtonGroup>
        <PrimaryButton label="Edit" onPress={() => router.push({ pathname: '/category/[id]/edit', params: { id } })} />
        <PrimaryButton label="Delete" loading={loading} variant="danger" onPress={showConfirm} />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Category"
        message="Are you sure you want to delete this category? Activities using it may lose their category reference."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={cancelConfirm}
      />
    </ScreenContainer>
  );
}
