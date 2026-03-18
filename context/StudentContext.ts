import { createContext, useContext } from 'react';
import type { Student } from '@/types';

export type StudentContextType = {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
};

export const StudentContext = createContext<StudentContextType | null>(null);

export function useStudentContext(): StudentContextType {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudentContext must be used within a StudentContext.Provider');
  }
  return context;
}
