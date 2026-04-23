import ButtonGroup from '@/components/buttons/ButtonGroup';
import PrimaryButton from '@/components/buttons/PrimaryButton';

type Props = {
  /** Invoked when the user taps "Edit". */
  onEdit: () => void;
  /** Invoked when the user taps "Delete" (typically opens a confirm dialog). */
  onDelete: () => void;
  /**
   * Optional "Back" action. Leave this out on screens that already show a
   * back chevron at the top, so the user doesn't see two back buttons.
   */
  onBack?: () => void;
  /** Shows the loading spinner on the Delete button. */
  loading?: boolean;
};

/**
 * The Edit / Delete button row shown at the bottom of every entity detail
 * screen (activity, category, goal). Keeps the buttons looking and behaving
 * the same everywhere they appear.
 */
export function EntityActions({ onEdit, onDelete, onBack, loading }: Props) {
  return (
    <ButtonGroup>
      <PrimaryButton label="Edit" onPress={onEdit} />
      <PrimaryButton label="Delete" loading={loading} variant="danger" onPress={onDelete} />
      {onBack ? <PrimaryButton label="Back" variant="secondary" onPress={onBack} /> : null}
    </ButtonGroup>
  );
}
