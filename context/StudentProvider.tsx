import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StudentContext } from './StudentContext';
import { getAllStudents, seedStudentsIfEmpty } from '@/db';
import type { Student } from '@/types';

type Props = {
  children: ReactNode;
};

/**
 * Provider component — wraps the app and manages student state.
 * Separated from _layout.tsx so the layout stays a thin shell.
 */
export default function StudentProvider({ children }: Props) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      await seedStudentsIfEmpty();
      const rows = await getAllStudents();
      setStudents(rows);
    };

    void loadStudents();
  }, []);

  return (
    <StudentContext.Provider value={{ students, setStudents }}>
      {children}
    </StudentContext.Provider>
  );
}
