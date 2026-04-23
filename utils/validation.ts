import type { ActivityFormData, TargetFormData, RegisterFormData, LoginFormData, CategoryFormData } from '@/types';

/**
 * The shared validators for every form in the app. Each function checks
 * the user's input and returns either a friendly error message or null
 * when the form is good to go.
 */
export function validateActivityForm(data: ActivityFormData): string | null {
  if (!data.date) return 'Date is required.';
  if (!data.metric || Number(data.metric) <= 0) return 'Duration must be a positive number.';
  if (!data.categoryId) return 'Category is required.';
  return null;
}

/**
 * Per-field validation used by the two-step Log Activity wizard so each
 * required field can surface its own inline error instead of a single
 * top-of-form string. Keys match `ActivityFormData` field names so the
 * wizard can look up errors via `errors[field]` without a mapping table.
 */
export type ActivityFieldErrors = Partial<
  Record<'categoryId' | 'date' | 'metric' | 'place', string>
>;

export function validateActivityFields(data: ActivityFormData): ActivityFieldErrors {
  const errors: ActivityFieldErrors = {};
  if (!data.place.trim()) {
    errors.place = 'Add a place - pick one nearby or type it in.';
  }
  if (!data.categoryId) errors.categoryId = 'Pick a category so we know what kind of activity this is.';
  if (!data.date) errors.date = 'Select a date for this activity.';
  if (!data.metric || Number(data.metric) <= 0) {
    errors.metric = 'Set how long this takes.';
  }
  return errors;
}

/**
 * Validates target form data. Returns error message or null if valid.
 */
export function validateTargetForm(data: TargetFormData): string | null {
  if (!data.categoryId) return 'Category is required.';
  if (!data.targetValue || Number(data.targetValue) <= 0) return 'Target value must be a positive number.';
  return null;
}

/**
 * Validates category form data. Returns error message or null if valid.
 */
export function validateCategoryForm(data: CategoryFormData): string | null {
  if (!data.name.trim()) return 'Category name is required.';
  if (!data.color.trim()) return 'Color is required.';
  if (!data.icon.trim()) return 'Icon is required.';
  return null;
}

/**
 * Validates register form data. Returns error message or null if valid.
 */
export function validateRegisterForm(data: RegisterFormData): string | null {
  if (!data.email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Please enter a valid email address.';
  if (!data.password) return 'Password is required.';
  if (data.password.length < 6) return 'Password must be at least 6 characters.';
  if (data.password !== data.confirmPassword) return 'Passwords do not match.';
  return null;
}

/**
 * Validates login form data. Returns error message or null if valid.
 */
export function validateLoginForm(data: LoginFormData): string | null {
  if (!data.email.trim()) return 'Email is required.';
  if (!data.password) return 'Password is required.';
  return null;
}
