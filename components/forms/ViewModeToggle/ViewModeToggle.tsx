import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ViewMode } from '@/types';

const MODES: { label: string; value: ViewMode }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

type Props = {
  selected: ViewMode;
  onSelect: (mode: ViewMode) => void;
};

export default function ViewModeToggle({ selected, onSelect }: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Select time view"
    >
      {MODES.map((m) => {
        const active = selected === m.value;
        return (
          <Pressable
            key={m.value}
            style={[styles.pill, active && { backgroundColor: theme.accentAction }]}
            onPress={() => onSelect(m.value)}
            accessibilityRole="radio"
            accessibilityLabel={m.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, { color: active ? theme.textButton : theme.textSecondary }]}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    padding: Spacing.xs,
  },
  pill: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
