import { StyleSheet, View } from 'react-native';
import PillToggle from '@/components/forms/PillToggle/PillToggle';
import { Colors, Spacing, BorderRadius } from '@/constants';
import type { ViewMode } from '@/types';

const MODES = [
  { label: 'Daily', value: 'daily' as ViewMode },
  { label: 'Weekly', value: 'weekly' as ViewMode },
  { label: 'Monthly', value: 'monthly' as ViewMode },
];

type Props = {
  selected: ViewMode;
  onSelect: (mode: ViewMode) => void;
};

/**
 * Segmented control for switching between daily/weekly/monthly views.
 * Wraps PillToggle in a tinted container for visual distinction.
 */
export default function ViewModeToggle({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <PillToggle
        options={MODES}
        selected={selected}
        onSelect={onSelect}
        accessibilityLabel="Select time view"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
