import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks';
import { Spacing } from '@/constants';

type Props = {
  /** Ionicon name shown alongside the label. */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Primary text for the toggle row. */
  label: string;
  /** Optional helper text shown beneath the row. */
  hint?: string;
  /** Current switch value. */
  value: boolean;
  /** Invoked when the user flips the switch. */
  onValueChange: (value: boolean) => void;
  /** Screen-reader label — defaults to `Toggle {label}`. */
  accessibilityLabel?: string;
};

/**
 * Labeled icon + switch row used inside SettingsSection cards on the Profile screen.
 */
export function SettingToggle({
  icon,
  label,
  hint,
  value,
  onValueChange,
  accessibilityLabel,
}: Props) {
  const theme = useAppTheme();
  return (
    <>
      <View style={styles.row}>
        <View style={styles.labelWrap}>
          <Ionicons name={icon} size={20} color={theme.accentAction} />
          <Text style={[styles.labelText, { color: theme.textPrimary }]}>{label}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.cardBorder, true: theme.accentAction }}
          accessibilityLabel={accessibilityLabel ?? `Toggle ${label}`}
        />
      </View>
      {hint ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
});
