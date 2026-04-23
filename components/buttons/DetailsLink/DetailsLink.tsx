import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PressableOpacity } from '../PressableOpacity';

type Props = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
};

/**
 * The "View Details" text link shown at the bottom of activity and goal
 * cards. Coloured with the app accent and paired with a chevron so it
 * reads as a tappable affordance without needing a button background.
 */
export function DetailsLink({ onPress, label = 'View Details', accessibilityLabel }: Props) {
  const theme = useAppTheme();
  return (
    <PressableOpacity
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.row}>
        <Text style={[styles.link, { color: theme.accentAction }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={14} color={theme.accentAction} />
      </View>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
});
