import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useActivities, useCategories } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
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

  const activity = findActivityById(Number(id));
  if (!activity) return null;

  const category = findCategoryById(activity.categoryId);

  const handleDelete = async () => {
    await deleteActivity(Number(id));
    router.back();
  };

  return (
    <ScreenContainer>
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
        <PrimaryButton label="Delete" variant="danger" onPress={handleDelete} />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>
    </ScreenContainer>
  );
}
