import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useActivities, useCategories, useToast, useHaptics } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

/**
 * Activity detail screen — view, edit, or delete an activity.
 */
export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, deleteActivity } = useActivities();
  const { findCategoryById } = useCategories();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const activity = findActivityById(Number(id));
  if (!activity) return null;

  const category = findCategoryById(activity.categoryId);

  const handleDelete = async () => {
    setConfirmVisible(false);
    setLoading(true);
    await deleteActivity(Number(id));
    haptics.success();
    showToast('Activity deleted', 'success');
    setTimeout(() => router.back(), 600);
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title={activity.date} subtitle="Activity details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Duration" value={`${activity.metric} min`} />
        {category && <InfoTag label="Category" value={category.name} />}
      </View>

      {activity.notes ? (
        <View style={SharedStyles.tagRow}>
          <InfoTag label="Notes" value={activity.notes} />
        </View>
      ) : null}

      <ButtonGroup>
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: '/activity/[id]/edit', params: { id } })}
        />
        <PrimaryButton
          label={loading ? 'Deleting...' : 'Delete'}
          variant="danger"
          onPress={() => { haptics.warning(); setConfirmVisible(true); }}
        />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScreenContainer>
  );
}
