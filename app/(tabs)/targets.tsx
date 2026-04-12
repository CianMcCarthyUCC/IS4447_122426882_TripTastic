import { useRouter } from 'expo-router';
import { useTargets, useCategories, useActivities } from '@/hooks';
import { PrimaryButton } from '@/components/buttons';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { TargetList } from '@/components/lists';

/**
 * Targets tab — list all targets with progress indicators.
 */
export default function TargetsScreen() {
  const router = useRouter();
  const { targets } = useTargets();
  const { categories } = useCategories();
  const { activities } = useActivities();

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Targets" subtitle={`${targets.length} goals set`} />
      <PrimaryButton
        label="Add Target"
        onPress={() => router.push('/target/add')}
      />
      <TargetList targets={targets} categories={categories} activities={activities} />
    </ScreenContainer>
  );
}
