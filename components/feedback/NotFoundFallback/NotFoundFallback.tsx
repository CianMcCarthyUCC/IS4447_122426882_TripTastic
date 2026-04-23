import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { PrimaryButton } from '@/components/buttons';

type Props = {
  /** One-line explanation shown under the "Not Found" title. */
  subtitle: string;
  /** Invoked when the user taps "Go Back". */
  onBack: () => void;
};

/**
 * The fallback screen shown when the user opens a detail page for
 * something that's been deleted or never existed. Keeps the user
 * oriented with a clear message and a way back.
 */
export function NotFoundFallback({ subtitle, onBack }: Props) {
  return (
    <ScreenContainer>
      <ScreenHeader title="Not Found" subtitle={subtitle} />
      <PrimaryButton label="Go Back" variant="secondary" onPress={onBack} />
    </ScreenContainer>
  );
}
