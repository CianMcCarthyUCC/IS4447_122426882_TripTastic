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

  if (!activity) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Not Found" subtitle="This activity may have been deleted." />
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const category = findCategoryById(activity.categoryId);

  const handleDelete = async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await deleteActivity(Number(id));
      haptics.success();
      showToast('Activity deleted', 'success');
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
      <ScreenHeader title={activity.date} subtitle="Trip activity details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Duration" value={`${activity.metric} min`} />
        <InfoTag label="Category" value={category?.name ?? 'Uncategorised'} />
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
          label="Delete"
          loading={loading}
          variant="danger"
          onPress={() => { haptics.warning(); setConfirmVisible(true); }}
        />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Activity"
        message="Are you sure you want to remove this activity from your trip? This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScreenContainer>
  );
}
