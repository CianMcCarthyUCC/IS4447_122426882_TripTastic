export { db, initializeDatabase } from './client';
export { trips, categories, activities, targets, users, sessions } from './schema';
export { seedDataIfEmpty } from './seed';
export {
  getAllCategories,
  insertCategory,
  updateCategoryById,
  deleteCategoryById,
  getAllActivities,
  insertActivity,
  updateActivityById,
  deleteActivityById,
  getAllTargets,
  insertTarget,
  updateTargetById,
  deleteTargetById,
  findUserByEmail,
  findUserWithHashByEmail,
  findUserById,
  insertUser,
  deleteUserById,
  getActiveSession,
  createSession,
  clearSessionDb,
} from './repository';
