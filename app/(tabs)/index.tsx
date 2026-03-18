import { useRouter } from 'expo-router';
import { useStudents } from '@/hooks';
import { PrimaryButton } from '@/components/buttons';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { StudentList } from '@/components/lists';

/**
 * Main screen — just imports and composition. No inline logic.
 */
export default function IndexScreen() {
  const router = useRouter();
  const { students } = useStudents();

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Students" subtitle={`${students.length} enrolled`} />
      <PrimaryButton label="Add Student" onPress={() => router.push({ pathname: '../add' })} />
      <StudentList students={students} />
    </ScreenContainer>
  );
}
