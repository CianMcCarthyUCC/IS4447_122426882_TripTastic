import { memo, useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SharedStyles } from '@/constants';
import { dismissOverlayLabel } from '@/utils';

export type DropdownOption = {
  label: string;
  value: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  label?: string;
  helpText?: string;
  options: DropdownOption[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  // When supplied, a "+ <createLabel>" row is rendered at the bottom of
  // the options list. Tapping it closes the sheet and fires `onCreate`,
  // giving the parent a slot to push a create-new flow without shipping
  // users off to a separate screen.
  onCreate?: () => void;
  createLabel?: string;
};

/**
 * The standard dropdown selector used across the app. Tapping the field
 * opens a bottom sheet listing the options, with optional icon/colour
 * badges and a slot to add a brand new option inline.
 */
function Dropdown({
  label,
  helpText,
  options,
  selected,
  onSelect,
  placeholder = 'Select...',
  accessibilityLabel,
  onCreate,
  createLabel = 'Create new',
}: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === selected);

  const handleSelect = useCallback((value: string) => {
    onSelect(value);
    setOpen(false);
  }, [onSelect]);

  return (
    <View style={SharedStyles.fieldWrapper}>
      {label ? (
        <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]}>{label}</Text>
      ) : null}
      {helpText ? (
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>{helpText}</Text>
      ) : null}

      {/* Trigger */}
      <Pressable
        style={[styles.trigger, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Select option'}
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.color && (
            <View style={[styles.dot, { backgroundColor: selectedOption.color }]} />
          )}
          {selectedOption?.icon && (
            <Ionicons name={selectedOption.icon} size={18} color={theme.accentAction} style={styles.triggerIcon} />
          )}
          <Text
            style={[styles.triggerText, { color: selectedOption ? theme.textPrimary : theme.textSecondary }]}
            numberOfLines={1}
          >
            {selectedOption?.label ?? placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      {/* Modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={dismissOverlayLabel(label ?? 'picker')}
        >
          <View style={[styles.sheet, { backgroundColor: theme.cardBackground }]} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{label ?? 'Select'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.optionsList}>
              {options.map((opt) => {
                const active = selected === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.option, active && { backgroundColor: theme.tagBackground }]}
                    onPress={() => handleSelect(opt.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={opt.label}
                    accessibilityState={{ selected: active }}
                  >
                    {opt.icon ? (
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={opt.color ?? (active ? Palette.coral : theme.textSecondary)}
                      />
                    ) : opt.color ? (
                      <View style={[styles.dot, { backgroundColor: opt.color }]} />
                    ) : null}
                    <Text style={[styles.optionText, { color: theme.textPrimary }, active && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={20} color={Palette.coral} />}
                  </Pressable>
                );
              })}

              {onCreate ? (
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    onCreate();
                  }}
                  style={[styles.option, styles.createRow, { borderColor: theme.accentAction }]}
                  accessibilityRole="button"
                  accessibilityLabel={createLabel}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.accentAction} />
                  <Text
                    style={[styles.optionText, styles.createText, { color: theme.accentAction }]}
                    numberOfLines={1}
                  >
                    {createLabel}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            <Pressable
              style={[styles.closeButton, { borderColor: theme.inputBorder }]}
              onPress={() => setOpen(false)}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={[styles.closeText, { color: theme.textPrimary }]}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default memo(Dropdown);

const styles = StyleSheet.create({
  helpText: { fontSize: 13, marginBottom: Spacing.xs },
  trigger: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  triggerContent: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  triggerIcon: { marginRight: Spacing.sm },
  triggerText: { fontSize: 16, flex: 1 },
  dot: { borderRadius: BorderRadius.pill, height: 12, marginRight: Spacing.sm, width: 12 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '60%',
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
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
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  optionsList: { maxHeight: 300 },
  option: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  optionText: { flex: 1, fontSize: 16 },
  optionTextActive: { fontWeight: '700' },
  createRow: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  createText: { fontWeight: '700' },
  closeButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeText: { fontSize: 16, fontWeight: '700' },
});
