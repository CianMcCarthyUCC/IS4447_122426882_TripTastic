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
  /**
   * When set, renders inline red helper text under the input and tints
   * the border red so the user sees exactly which field failed validation
   * instead of scanning a single top-of-form message.
   */
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * The standard labelled text input used throughout the app's forms.
 * Supports inline help text and error messages, and is wired up for
 * screen readers so the label and input are announced together.
 */
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  helpText,
  error,
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
        style={[
          SharedStyles.fieldInput,
          {
            color: theme.textPrimary,
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.dangerAction : theme.inputBorder,
          },
        ]}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? helpText ?? `Enter ${label.toLowerCase()}`}
        accessibilityLabelledBy={inputId}
      />
      {error ? (
        <Text
          style={[styles.errorText, { color: theme.dangerAction }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  helpText: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
