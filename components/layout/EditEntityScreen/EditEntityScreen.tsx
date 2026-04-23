import { memo, type ReactNode } from 'react';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toast } from '@/components/feedback';
import type { useFormSubmit } from '@/hooks';

type FormSubmitToast = ReturnType<typeof useFormSubmit>['toast'];

type Props = {
  /** Title shown in the page header. */
  title: string;
  /** Toast state from `useFormSubmit` so the screen can surface save errors. */
  toast: FormSubmitToast;
  onHideToast: () => void;
  /** The form itself. Caller wires it up to the submit/validation it owns. */
  children: ReactNode;
};

/**
 * The shared chrome for every "edit entity" screen rendered as a regular
 * page (edit activity, edit category, edit goal). Handles the screen
 * container, header and toast so each screen can focus on its own form.
 */
function EditEntityScreen({ title, toast, onHideToast, children }: Props) {
  return (
    <ScreenContainer>
      <Toast {...toast} onHide={onHideToast} />
      <PageHeader title={title} />
      {children}
    </ScreenContainer>
  );
}

export default memo(EditEntityScreen);
