import { useCallback } from 'react';
import { useStudentContext } from '@/context';
import { getAllStudents, insertStudent, updateStudentById, deleteStudentById } from '@/db';
import type { StudentFormData } from '@/types';

/**
 * Central hook for all student CRUD operations.
 * Local SQLite is fast enough that optimistic updates aren't needed.
 *
 * This hook handles DATA only — no navigation.
 * Screens decide what to do after a successful operation.
 */
export function useStudents() {
  const { students, setStudents } = useStudentContext();

  const refreshStudents = useCallback(async () => {
    const rows = await getAllStudents();
    setStudents(rows);
  }, [setStudents]);

  const addStudent = useCallback(
    async (formData: StudentFormData) => {
      await insertStudent(formData);
      await refreshStudents();
    },
    [refreshStudents],
  );

  const updateStudent = useCallback(
    async (id: number, formData: StudentFormData) => {
      await updateStudentById(id, formData);
      await refreshStudents();
    },
    [refreshStudents],
  );

  const deleteStudent = useCallback(
    async (id: number) => {
      await deleteStudentById(id);
      await refreshStudents();
    },
    [refreshStudents],
  );

  const findStudentById = useCallback(
    (id: number) => {
      return students.find((s) => s.id === id);
    },
    [students],
  );

  return {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    findStudentById,
    refreshStudents,
  };
}
