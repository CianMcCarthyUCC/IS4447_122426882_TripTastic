import { Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { SharedStyles } from '@/constants';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={SharedStyles.fieldLabel} accessibilityRole="text">{label}</Text>
      <TextInput
        placeholder={placeholder ?? label}
        value={value}
        onChangeText={onChangeText}
        style={SharedStyles.fieldInput}
        keyboardType={keyboardType}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
      />
    </View>
  );
}
