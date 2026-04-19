import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useActivities, useCategories, useDeleteWithConfirm } from '@/hooks';
import { EntityActions } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ConfirmDialog, Toast, NotFoundFallback } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findActivityById, deleteActivity } = useActivities();
  const { findCategoryById } = useCategories();

  const activity = findActivityById(Number(id));

  const { loading, confirmVisible, showConfirm, cancelConfirm, handleDelete, toast, hideToast } =
    useDeleteWithConfirm(() => deleteActivity(Number(id)), 'Activity deleted');

  if (!activity) {
    return <NotFoundFallback subtitle="This activity may have been deleted." onBack={() => router.back()} />;
  }

  const category = findCategoryById(activity.categoryId);

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title={activity.date} subtitle="Trip activity details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag icon="time-outline" label="Duration" value={`${activity.metric} min`} />
        <InfoTag icon="pricetag-outline" label="Category" value={category?.name ?? 'Uncategorised'} />
        <InfoTag
          icon={activity.status === 'completed' ? 'checkmark-circle-outline' : 'ellipse-outline'}
          label="Status"
          value={activity.status === 'completed' ? 'Completed' : 'Planned'}
        />
      </View>

      {activity.notes ? (
        <View style={SharedStyles.tagRow}>
          <InfoTag icon="document-text-outline" label="Notes" value={activity.notes} />
        </View>
      ) : null}

      <EntityActions
        onEdit={() => router.push({ pathname: '/activity/[id]/edit', params: { id } })}
        onDelete={showConfirm}
        onBack={() => router.back()}
        loading={loading}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Activity"
        message="Are you sure you want to remove this activity from your trip? This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={cancelConfirm}
      />
    </ScreenContainer>
  );
}
