import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from './useToast';
import { useHaptics } from './useHaptics';

/**
 * Reusable delete-with-confirmation hook.
 * Handles confirm dialog state, loading, try-catch, toast, haptics, navigation.
 * Eliminates duplicated delete pattern across all 3 detail screens.
 */
export function useDeleteWithConfirm(
  onDelete: () => Promise<void>,
  successMessage: string,
) {
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const router = useRouter();

  const showConfirm = useCallback(() => {
    haptics.warning();
    setConfirmVisible(true);
  }, [haptics]);

  const cancelConfirm = useCallback(() => {
    setConfirmVisible(false);
  }, []);

  const handleDelete = useCallback(async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await onDelete();
      haptics.success();
      showToast(successMessage, 'success');
      router.back();
    } catch {
      showToast('Failed to delete. Please try again.', 'error');
      haptics.error();
    } finally {
      setLoading(false);
    }
  }, [onDelete, successMessage, haptics, showToast, router]);

  return { loading, confirmVisible, showConfirm, cancelConfirm, handleDelete, toast, hideToast };
}
