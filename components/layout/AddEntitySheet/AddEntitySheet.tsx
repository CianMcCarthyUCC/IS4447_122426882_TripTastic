import { memo, type ReactNode } from 'react';
import { Toast } from '@/components/feedback';
import { SlideUpSheet } from '@/components/modals';
import type { useFormSubmit } from '@/hooks';

type FormSubmitToast = ReturnType<typeof useFormSubmit>['toast'];

type Props = {
  /** Sheet title shown in the handle area. */
  title: string;
  /** Optional subtitle shown under the title. */
  subtitle?: string;
  /** Called when the user dismisses the sheet (swipe-down or Cancel). */
  onClose: () => void;
  /** Toast state from `useFormSubmit` so the sheet can surface save errors. */
  toast: FormSubmitToast;
  onHideToast: () => void;
  /** The form itself. Caller wires it up to the submit/validation it owns. */
  children: ReactNode;
};

/**
 * The shared chrome for every "add new entity" screen presented as a
 * bottom sheet (new category, new goal, new activity). Keeps the sheet,
 * toast and close behaviour consistent so each screen only has to worry
 * about its own form.
 */
function AddEntitySheet({ title, subtitle, onClose, toast, onHideToast, children }: Props) {
  return (
    <SlideUpSheet title={title} subtitle={subtitle} onClose={onClose}>
      <Toast {...toast} onHide={onHideToast} />
      {children}
    </SlideUpSheet>
  );
}

export default memo(AddEntitySheet);
