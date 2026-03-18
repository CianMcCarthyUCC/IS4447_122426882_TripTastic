import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export default function FormField({ label, value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder ?? label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textLabel,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
