import { useId } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { SharedStyles } from '@/constants';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Reusable text input with label.
 * Label and input are associated via nativeID for screen reader support.
 */
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const inputId = useId();

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={SharedStyles.fieldLabel} nativeID={inputId}>{label}</Text>
      <TextInput
        placeholder={placeholder ?? label}
        value={value}
        onChangeText={onChangeText}
        style={SharedStyles.fieldInput}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint ?? `Enter ${label.toLowerCase()}`}
        accessibilityLabelledBy={inputId}
      />
    </View>
  );
}
