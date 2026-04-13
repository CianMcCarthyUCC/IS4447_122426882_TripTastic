import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from './useToast';
import { useHaptics } from './useHaptics';

/**
 * Reusable form submission hook — handles validation, loading, error, success flow.
 * Eliminates duplicated try-catch-finally pattern across all 6 add/edit screens.
 */
export function useFormSubmit(
  onSubmit: () => Promise<void>,
  successMessage: string,
) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const router = useRouter();

  const handleSubmit = useCallback(async (validationError: string | null) => {
    if (validationError) {
      setError(validationError);
      haptics.error();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit();
      haptics.success();
      showToast(successMessage, 'success');
      router.back();
    } catch {
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  }, [onSubmit, successMessage, haptics, showToast, router]);

  return { error, loading, handleSubmit, toast, hideToast };
}
