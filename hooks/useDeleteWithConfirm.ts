import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useToast } from './useToast';
import { useHaptics } from './useHaptics';
import { emitToast } from './toastBus';

/**
 * The shared helper used on every detail screen for the delete button.
 * Opens the confirmation dialog, shows a toast on success and navigates
 * back, so each detail screen keeps the same safe flow.
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
      // Emit globally so the toast outlives router.back() unmounting this screen.
      emitToast(successMessage, 'success');
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
