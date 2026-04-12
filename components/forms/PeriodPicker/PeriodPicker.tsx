import PillToggle from '@/components/forms/PillToggle/PillToggle';
import type { TargetPeriod } from '@/types';

const PERIODS = [
  { label: 'Weekly', value: 'weekly' as TargetPeriod },
  { label: 'Monthly', value: 'monthly' as TargetPeriod },
];

type Props = {
  label?: string;
  selectedPeriod: TargetPeriod;
  onSelect: (period: TargetPeriod) => void;
};

/**
 * Period selector — thin wrapper over PillToggle for weekly/monthly.
 */
export default function PeriodPicker({
  label = 'Period',
  selectedPeriod,
  onSelect,
}: Props) {
  return (
    <PillToggle
      label={label}
      options={PERIODS}
      selected={selectedPeriod}
      onSelect={onSelect}
      accessibilityLabel="Select a period"
    />
  );
}
