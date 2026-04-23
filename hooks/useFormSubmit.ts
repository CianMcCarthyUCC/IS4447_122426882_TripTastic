import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from './useToast';
import { useHaptics } from './useHaptics';
import { emitToast } from './toastBus';

/**
 * The shared helper that every form uses for its submit button. Takes
 * care of running the validation, showing the loading spinner, surfacing
 * any error and showing a success toast on save, so each individual form
 * only has to focus on what makes it unique.
 */
export function useFormSubmit(
  onSubmit: () => Promise<void>,
  successMessage: string,
  afterSuccess?: () => void,
) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const router = useRouter();

  const afterSuccessRef = useRef(afterSuccess);
  afterSuccessRef.current = afterSuccess;

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
      if (afterSuccessRef.current) {
        afterSuccessRef.current();
      } else {
        // Emit on the global bus so the toast outlives this screen
        // once router.back() unmounts it.
        emitToast(successMessage, 'success');
        router.back();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  }, [onSubmit, successMessage, haptics, showToast, router]);

  return { error, loading, handleSubmit, toast, hideToast };
}
