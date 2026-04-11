import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useStudents, useStudentForm } from '@/hooks';
import { StudentForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Edit screen — thin shell. Reuses same StudentForm and hooks as Add screen.
 */
export default function EditStudent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findStudentById, updateStudent } = useStudents();
  const { formData, onChangeField, populateForm } = useStudentForm();

  const student = findStudentById(Number(id));

  useEffect(() => {
    if (!student) return;
    populateForm({ name: student.name, major: student.major, year: student.year });
  }, [student?.id, populateForm]);

  if (!student) return null;

  const handleSubmit = async () => {
    await updateStudent(Number(id), formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Edit Student" subtitle={`Update ${student.name}`} />
      <StudentForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Changes"
      />
    </ScreenContainer>
  );
}
