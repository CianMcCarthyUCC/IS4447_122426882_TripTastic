import { eq } from 'drizzle-orm';
import { db } from './client';
import { students } from './schema';
import type { StudentFormData } from '@/types';

/**
 * Data access layer — all database operations in one place.
 * Hooks and components never touch the DB directly.
 * This makes the app easier to test and maintain.
 */

export async function getAllStudents() {
  return db.select().from(students);
}

export async function insertStudent(data: StudentFormData) {
  await db.insert(students).values({ ...data, count: 0 });
}

export async function updateStudentById(id: number, data: StudentFormData) {
  await db.update(students).set(data).where(eq(students.id, id));
}

export async function deleteStudentById(id: number) {
  await db.delete(students).where(eq(students.id, id));
}
