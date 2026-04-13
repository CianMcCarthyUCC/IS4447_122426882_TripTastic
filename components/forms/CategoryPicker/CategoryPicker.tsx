import { useMemo } from 'react';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import type { DropdownOption } from '@/components/forms/Dropdown/Dropdown';
import type { Category } from '@/types';

type Props = {
  label?: string;
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
};

/**
 * Category selector — uses Dropdown bottom sheet.
 * Shows category colour dot next to each option.
 */
export default function CategoryPicker({
  label = 'Category',
  categories,
  selectedId,
  onSelect,
}: Props) {
  const options = useMemo<DropdownOption[]>(
    () => categories.map((c) => ({ label: c.name, value: String(c.id), color: c.color })),
    [categories],
  );

  return (
    <Dropdown
      label={label}
      helpText="What type of activity is this?"
      options={options}
      selected={String(selectedId)}
      onSelect={(v) => onSelect(Number(v))}
      placeholder="Choose a category"
      accessibilityLabel="Select a category"
    />
  );
}
