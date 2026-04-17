import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { PrimaryButton } from '@/components/buttons';

type Props = {
  /** One-line explanation shown under the "Not Found" title. */
  subtitle: string;
  /** Invoked when the user taps "Go Back". */
  onBack: () => void;
};

/**
 * Shared fallback for detail screens when the requested entity
 * (activity, category, target, etc.) no longer exists.
 */
export function NotFoundFallback({ subtitle, onBack }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader title="Not Found" subtitle={subtitle} />
      <PrimaryButton label="Go Back" variant="secondary" onPress={onBack} />
    </ScreenContainer>
  );
}
