import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '@/components/forms/Dropdown/Dropdown';
import type { DropdownOption } from '@/components/forms/Dropdown/Dropdown';
import { Spacing, Palette } from '@/constants';
import type { Trip } from '@/types';

type Props = {
  trips: Trip[];
  currentTrip: Trip | null;
  onSelect: (id: number) => void;
  onAddTrip: () => void;
};

/**
 * The trip selector used wherever the user needs to choose a trip
 * (for example when scoping a goal). Shows each trip as a dropdown row
 * and includes a shortcut to create a new trip.
 */
function TripPicker({ trips, currentTrip, onSelect, onAddTrip }: Props) {
  const options = useMemo<DropdownOption[]>(
    () => trips.map((t) => ({ label: `${t.name} - ${t.destination}`, value: String(t.id), icon: 'airplane' })),
    [trips],
  );

  return (
    <View style={styles.row}>
      <View style={styles.dropdown}>
        <Dropdown
          label="Trip"
          options={options}
          selected={String(currentTrip?.id ?? '')}
          onSelect={(v) => onSelect(Number(v))}
          placeholder="Select a trip"
          accessibilityLabel="Select trip"
        />
      </View>
      <Pressable
        style={styles.addButton}
        onPress={onAddTrip}
        accessibilityLabel="Add new trip"
        accessibilityRole="button"
      >
        <Ionicons name="add-circle" size={36} color={Palette.coral} />
      </Pressable>
    </View>
  );
}

export default memo(TripPicker);

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dropdown: {
    flex: 1,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
});
