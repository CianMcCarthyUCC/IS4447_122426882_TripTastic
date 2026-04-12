import type { ActivityFormData, TargetFormData } from '@/types';

/**
 * Validates activity form data. Returns error message or null if valid.
 */
export function validateActivityForm(data: ActivityFormData): string | null {
  if (!data.date) return 'Date is required.';
  if (!data.metric || Number(data.metric) <= 0) return 'Duration must be a positive number.';
  if (!data.categoryId) return 'Category is required.';
  return null;
}

/**
 * Validates target form data. Returns error message or null if valid.
 */
export function validateTargetForm(data: TargetFormData): string | null {
  if (!data.categoryId) return 'Category is required.';
  if (!data.targetValue || Number(data.targetValue) <= 0) return 'Target value must be a positive number.';
  return null;
}
