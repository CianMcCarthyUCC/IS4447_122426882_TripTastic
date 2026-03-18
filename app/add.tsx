import { useRouter } from 'expo-router';
import { useStudents, useStudentForm } from '@/hooks';
import { StudentForm } from '@/components/forms';
import { ScreenHeader, ScreenContainer } from '@/components/layout';

/**
 * Add screen — thin shell. Form logic in useStudentForm, DB in useStudents.
 */
export default function AddStudent() {
  const router = useRouter();
  const { addStudent } = useStudents();
  const { formData, onChangeField } = useStudentForm();

  const handleSubmit = async () => {
    await addStudent(formData);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Add Student" subtitle="Create a new student profile." />
      <StudentForm
        formData={formData}
        onChangeField={onChangeField}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Save Student"
      />
    </ScreenContainer>
  );
}
