import Dropdown from '@/components/forms/Dropdown/Dropdown';
import type { TargetPeriod } from '@/types';

const OPTIONS = [
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' as const },
  { label: 'Monthly', value: 'monthly', icon: 'calendar' as const },
];

type Props = {
  label?: string;
  selectedPeriod: TargetPeriod;
  onSelect: (period: TargetPeriod) => void;
};

export default function PeriodPicker({ label = 'Period', selectedPeriod, onSelect }: Props) {
  return (
    <Dropdown
      label={label}
      helpText="Track this goal per week or per month?"
      options={OPTIONS}
      selected={selectedPeriod}
      onSelect={(v) => onSelect(v as TargetPeriod)}
      placeholder="Choose period"
      accessibilityLabel="Select a period"
    />
  );
}
