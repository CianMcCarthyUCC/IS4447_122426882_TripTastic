import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type Props = {
  label: string;
  value: string;
  /**
   * Optional leading icon. Use the Ionicons set so every tag in the app
   * shares a visual language - prefer the `-outline` variants for a light,
   * non-shouty chip and keep icons meaningfully paired with the label
   * (e.g. `calendar-outline` for Period, `flag-outline` for Target).
   */
  icon?: IoniconName;
};

/**
 * A small label + value chip, used for summarising details on cards and
 * detail screens (for example "Duration: 30 min"). Adds a leading icon
 * bubble when one is supplied so each tag is easy to scan.
 */
export default function InfoTag({ label, value, icon }: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: theme.tagBackground, borderColor: theme.cardBorder },
      ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={theme.tagLabel}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
      <Text style={[styles.label, { color: theme.tagLabel }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.tagValue }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pill with a hairline border - keeps the chip legible against light
  // card surfaces where the background-only fill can otherwise wash out.
  tag: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  icon: {
    // Small right margin rather than a flex gap keeps the icon visually
    // hugged to the label without affecting label↔value spacing.
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: Spacing.xs,
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
  },
});
