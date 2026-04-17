import ButtonGroup from '@/components/buttons/ButtonGroup';
import PrimaryButton from '@/components/buttons/PrimaryButton';

type Props = {
  /** Invoked when the user taps "Edit". */
  onEdit: () => void;
  /** Invoked when the user taps "Delete" (typically opens a confirm dialog). */
  onDelete: () => void;
  /** Invoked when the user taps "Back". */
  onBack: () => void;
  /** Shows the loading spinner on the Delete button. */
  loading?: boolean;
};

/**
 * Standard Edit / Delete / Back button row used on every entity detail screen.
 * Keeps button ordering and variants consistent across activity / category / target.
 */
export function EntityActions({ onEdit, onDelete, onBack, loading }: Props) {
  return (
    <ButtonGroup>
      <PrimaryButton label="Edit" onPress={onEdit} />
      <PrimaryButton label="Delete" loading={loading} variant="danger" onPress={onDelete} />
      <PrimaryButton label="Back" variant="secondary" onPress={onBack} />
    </ButtonGroup>
  );
}
