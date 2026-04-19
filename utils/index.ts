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
export { countryToContinent, CONTINENTS } from './continent';
export type { Continent } from './continent';
export { computeStreaks } from './streakCalculator';
export type { StreakInfo } from './streakCalculator';
export {
  suggestActivityFilter,
  suggestTripFilter,
  suggestTargetFilter,
} from './filterSuggestions';
export type { FilterSuggestion } from './filterSuggestions';
export { promptFilterName, describeFilter } from './filterNamePrompt';
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
