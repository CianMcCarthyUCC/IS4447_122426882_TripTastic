import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, SharedStyles } from '@/constants';

type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Reusable date input — shows a native date picker on tap.
 * Same pattern as FormField but for dates.
 */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'Tap to select a date',
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const currentDate = value ? new Date(value) : new Date();

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={SharedStyles.fieldLabel} accessibilityRole="text">{label}</Text>
      <Pressable
        style={SharedStyles.fieldInput}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? 'Opens a date picker'}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
});
