import { memo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Date picker — opens a modal calendar (react-native-calendars).
 * Selected date highlighted in coral. Theme-aware.
 */
function DateField({
  label,
  value,
  onChange,
  placeholder = 'Tap to select a date',
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const [visible, setVisible] = useState(false);
  const theme = useAppTheme();

  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const handleDayPress = (day: { dateString: string }) => {
    setPendingDate(day.dateString);
  };

  const handleDone = () => {
    if (pendingDate) onChange(pendingDate);
    setPendingDate(null);
    setVisible(false);
  };

  const formattedDate = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]}>{label}</Text>

      <Pressable
        style={[styles.trigger, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? 'Opens a calendar to pick a date'}
      >
        <Ionicons name="calendar-outline" size={18} color={value ? Palette.coral : theme.textSecondary} />
        <Text style={[styles.triggerText, { color: value ? theme.textPrimary : theme.textSecondary }]}>
          {formattedDate ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDone}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={handleDone}>
          <View style={[styles.sheet, { backgroundColor: theme.cardBackground }]} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{label}</Text>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={{
                ...(value && !pendingDate ? { [value]: { selected: true, selectedColor: Palette.coral } } : {}),
                ...(pendingDate ? { [pendingDate]: { selected: true, selectedColor: Palette.coral } } : {}),
              }}
              theme={{
                backgroundColor: theme.cardBackground,
                calendarBackground: theme.cardBackground,
                textSectionTitleColor: theme.textSecondary,
                selectedDayBackgroundColor: Palette.coral,
                selectedDayTextColor: Palette.white,
                todayTextColor: Palette.coral,
                dayTextColor: theme.textPrimary,
                textDisabledColor: theme.cardBorder,
                monthTextColor: theme.textPrimary,
                arrowColor: Palette.coral,
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
                textDayHeaderFontWeight: '600',
              }}
            />

            <Pressable
              style={[styles.doneButton, { borderColor: theme.inputBorder }]}
              onPress={handleDone}
              accessibilityLabel="Confirm date"
              accessibilityRole="button"
            >
              <Text style={[styles.doneText, { color: theme.textPrimary }]}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default memo(DateField);

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 5,
    marginBottom: Spacing.lg,
    width: 40,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  doneButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
