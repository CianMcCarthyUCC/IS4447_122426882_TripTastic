import { Pressable, StyleSheet, Text } from 'react-native';
import { PlaneLoader } from '@/components/feedback/PlaneLoader';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';

type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'accent' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  /** Switch off the default light tap buzz for buttons pressed repeatedly. */
  haptic?: boolean;
};

/**
 * The standard button used across the app.
 * Handles disabled and loading states, plays a light haptic on tap,
 * and supports a few visual variants for different call-to-action levels.
 */
export default function PrimaryButton({
  label,
  onPress,
  compact = false,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  haptic = true,
}: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) haptics.light();
    onPress();
  };

  const bgColor = {
    primary: theme.primaryAction,
    accent: theme.accentAction,
    secondary: 'transparent',
    danger: theme.dangerAction,
  }[variant];

  const textColor = variant === 'secondary' ? theme.textButtonSecondary : theme.textButton;

  return (
    <Pressable
      onPress={isDisabled ? undefined : handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor },
        variant === 'secondary' && { borderColor: theme.inputBorder, borderWidth: 1.5, backgroundColor: theme.cardBackground },
        compact && styles.compact,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <PlaneLoader size="small" />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: textColor },
          compact && styles.compactLabel,
          isDisabled && styles.disabledLabel,
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
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  compact: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  compactLabel: {
    fontSize: 13,
  },
  disabledLabel: {
    opacity: 0.8,
  },
  spinner: {
    marginRight: Spacing.sm,
  },
});
