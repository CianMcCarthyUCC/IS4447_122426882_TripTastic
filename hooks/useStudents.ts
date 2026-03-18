import { useCallback, useOptimistic } from 'react';
import { useStudentContext } from '@/context';
import { getAllStudents, insertStudent, updateStudentById, deleteStudentById } from '@/db';
import type { Student, StudentFormData } from '@/types';

/**
 * Central hook for all student CRUD operations.
 * Uses useOptimistic for instant UI feedback before DB writes complete.
 *
 * Best practice: this hook handles DATA only — no navigation.
 * Screens decide what to do after a successful operation.
 */
export function useStudents() {
  const { students, setStudents } = useStudentContext();

  const [optimisticStudents, addOptimistic] = useOptimistic(
    students,
    (current: Student[], action: { type: string; payload: Student | number }) => {
      switch (action.type) {
        case 'add':
          return [...current, action.payload as Student];
        case 'delete':
          return current.filter((s) => s.id !== (action.payload as number));
        case 'update':
          return current.map((s) =>
            s.id === (action.payload as Student).id ? (action.payload as Student) : s,
          );
        default:
          return current;
      }
    },
  );

  const refreshStudents = useCallback(async () => {
    const rows = await getAllStudents();
    setStudents(rows);
  }, [setStudents]);

  const addStudent = useCallback(
    async (formData: StudentFormData) => {
      const tempStudent: Student = { id: Date.now(), ...formData, count: 0 };
      addOptimistic({ type: 'add', payload: tempStudent });

      await insertStudent(formData);
      await refreshStudents();
    },
    [addOptimistic, refreshStudents],
  );

  const updateStudent = useCallback(
    async (id: number, formData: StudentFormData) => {
      const updated: Student = { id, ...formData, count: 0 };
      addOptimistic({ type: 'update', payload: updated });

      await updateStudentById(id, formData);
      await refreshStudents();
    },
    [addOptimistic, refreshStudents],
  );

  const deleteStudent = useCallback(
    async (id: number) => {
      addOptimistic({ type: 'delete', payload: id });

      await deleteStudentById(id);
      await refreshStudents();
    },
    [addOptimistic, refreshStudents],
  );

  const findStudentById = useCallback(
    (id: number): Student | undefined => {
      return students.find((s) => s.id === id);
    },
    [students],
  );

  return {
    students: optimisticStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    findStudentById,
    refreshStudents,
  };
}
