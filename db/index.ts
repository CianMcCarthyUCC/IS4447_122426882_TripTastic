export { db } from './client';
export { students } from './schema';
export { seedStudentsIfEmpty } from './seed';
export {
  getAllStudents,
  insertStudent,
  updateStudentById,
  deleteStudentById,
} from './repository';
