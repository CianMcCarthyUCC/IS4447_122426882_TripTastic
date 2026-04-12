import { useRouter } from 'expo-router';
import { useActivities, useCategories } from '@/hooks';
import { PrimaryButton } from '@/components/buttons';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { ActivityList } from '@/components/lists';

/**
 * Main screen — activities list with add button.
 */
export default function IndexScreen() {
  const router = useRouter();
  const { activities } = useActivities();
  const { categories } = useCategories();

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Activities" subtitle={`${activities.length} recorded`} />
      <PrimaryButton
        label="Add Activity"
        onPress={() => router.push('/activity/add')}
      />
      <ActivityList activities={activities} categories={categories} />
    </ScreenContainer>
  );
}
