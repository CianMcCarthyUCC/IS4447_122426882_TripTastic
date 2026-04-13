export {
  getWeekNumber,
  getWeekLabel,
  getMonthLabel,
  getDayLabel,
  getMonthKey,
  getWeekKey,
  groupByPeriod,
  sortGroupedEntries,
} from './dateHelpers';

export { computeProgress, computeTargetCurrentValue } from './progressHelpers';
export type { ProgressData } from './progressHelpers';

export {
  validateActivityForm,
  validateTargetForm,
  validateCategoryForm,
  validateRegisterForm,
  validateLoginForm,
} from './validation';

export {
  hashPassword,
  verifyPassword,
  setSession,
  getSession,
  clearSession,
} from './auth';

export { exportDataAsCsv } from './csvExport';
export { computeStreaks } from './streakCalculator';
export type { StreakInfo } from './streakCalculator';
export { getWeather } from './weatherApi';
export type { WeatherData } from './weatherApi';
export { getCountryInfo } from './countriesApi';
export type { CountryData } from './countriesApi';
export { getDestinationPhoto } from './unsplashApi';

export {
  requestNotificationPermissions,
  configureNotifications,
  scheduleDailyReminder,
  scheduleGoalReminder,
  notifyGoalMet,
  cancelAllNotifications,
} from './notifications';
