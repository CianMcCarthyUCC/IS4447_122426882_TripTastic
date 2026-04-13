import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useCategories, useToast, useHaptics } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

/**
 * Category detail screen — view, edit, or delete a category.
 */
export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findCategoryById, deleteCategory } = useCategories();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const category = findCategoryById(Number(id));

  if (!category) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Not Found" subtitle="This category may have been deleted." />
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const handleDelete = async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await deleteCategory(Number(id));
      haptics.success();
      showToast('Category deleted', 'success');
      router.back();
    } catch {
      showToast('Failed to delete. Please try again.', 'error');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
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
        <PrimaryButton
          label="Delete"
          loading={loading}
          variant="danger"
          onPress={() => { haptics.warning(); setConfirmVisible(true); }}
        />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Category"
        message="Are you sure you want to delete this category? Activities using it may lose their category reference."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScreenContainer>
  );
}
