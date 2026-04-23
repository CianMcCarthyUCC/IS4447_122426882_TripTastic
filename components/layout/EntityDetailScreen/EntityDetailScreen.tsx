import { memo, type ReactNode } from 'react';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DecorativeCircles } from '@/components/layout/DecorativeCircles';
import { EntityActions } from '@/components/buttons';
import { ConfirmDialog, Toast } from '@/components/feedback';
import type { useDeleteWithConfirm } from '@/hooks';

type DeleteState = ReturnType<typeof useDeleteWithConfirm>;

type DeleteDialogCopy = {
  /** Title shown in the confirm dialog (e.g. "Delete Activity"). */
  title: string;
  /** Body copy for the dialog, explaining what will happen. */
  message: string;
  /** Label on the confirm button. Defaults to "Delete". */
  confirmLabel?: string;
};

type Props = {
  /** Title shown in the page header. */
  title: string;
  /** Fires when the user taps Edit. */
  onEdit: () => void;
  /** Delete state from `useDeleteWithConfirm`, wired in one go. */
  deleteState: DeleteState;
  /** Copy shown in the delete confirmation dialog. */
  deleteDialog: DeleteDialogCopy;
  /** Entity-specific content (tags, progress, sections) rendered between the header and actions. */
  children: ReactNode;
};

/**
 * The shared chrome used on every entity detail screen (activity, category,
 * goal). Handles the header, toast, edit / delete buttons and the
 * delete confirmation dialog so each screen only needs to supply its own
 * detail content.
 */
function EntityDetailScreen({
  title,
  onEdit,
  deleteState,
  deleteDialog,
  children,
}: Props) {
  const {
    loading,
    confirmVisible,
    showConfirm,
    cancelConfirm,
    handleDelete,
    toast,
    hideToast,
  } = deleteState;

  return (
    <ScreenContainer>
      <DecorativeCircles opacity={0.06} />
      <Toast {...toast} onHide={hideToast} />
      <PageHeader title={title} />

      {children}

      <EntityActions onEdit={onEdit} onDelete={showConfirm} loading={loading} />

      <ConfirmDialog
        visible={confirmVisible}
        title={deleteDialog.title}
        message={deleteDialog.message}
        confirmLabel={deleteDialog.confirmLabel ?? 'Delete'}
        onConfirm={handleDelete}
        onCancel={cancelConfirm}
      />
    </ScreenContainer>
  );
}

export default memo(EntityDetailScreen);
