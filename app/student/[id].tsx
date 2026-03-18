import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useStudents } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { SharedStyles } from '@/constants';

/**
 * Detail screen — thin shell. Data from useStudents, layout from components.
 */
export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findStudentById, deleteStudent } = useStudents();

  const student = findStudentById(Number(id));
  if (!student) return null;

  const handleDelete = async () => {
    await deleteStudent(Number(id));
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={student.name} subtitle="Student details" />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Major" value={student.major} />
        <InfoTag label="Year" value={student.year} />
      </View>

      <ButtonGroup>
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: '../student/[id]/edit', params: { id } })}
        />
        <PrimaryButton label="Delete" variant="danger" onPress={handleDelete} />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>
    </ScreenContainer>
  );
}
