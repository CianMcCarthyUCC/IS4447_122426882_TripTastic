import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors, BorderRadius } from '@/constants';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function PrimaryButton({
  label,
  onPress,
  compact = false,
  variant = 'primary',
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          compact && styles.compactLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primaryAction,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secondary: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: Colors.dangerAction,
  },
  compact: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: Colors.textButton,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: Colors.textButtonSecondary,
  },
  compactLabel: {
    fontSize: 13,
  },
});
