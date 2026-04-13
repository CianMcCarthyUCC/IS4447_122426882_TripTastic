import { useId } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { Spacing, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helpText?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Reusable text input with label and optional help text.
 * Label and input associated via nativeID for screen reader support.
 */
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  helpText,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const inputId = useId();
  const theme = useAppTheme();

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]} nativeID={inputId}>{label}</Text>
      {helpText ? (
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>{helpText}</Text>
      ) : null}
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        style={[SharedStyles.fieldInput, { color: theme.textPrimary, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? helpText ?? `Enter ${label.toLowerCase()}`}
        accessibilityLabelledBy={inputId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  helpText: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
});
