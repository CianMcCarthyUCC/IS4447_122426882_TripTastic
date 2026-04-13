import { memo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

export type ChipOption = {
  label: string;
  value: string;
  color?: string;
};

type Props = {
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  onSave?: () => void;
  accessibilityLabel?: string;
};

/**
 * Horizontal scrollable filter chips with animated selection.
 * Optional save button persists the current filter to SQLite.
 */
function FilterChips({ options, selected, onSelect, onSave, accessibilityLabel = 'Filter' }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
      >
        {options.map((opt) => (
          <Chip
            key={opt.value}
            option={opt}
            active={selected === opt.value}
            theme={theme}
            onPress={() => onSelect(opt.value)}
          />
        ))}

        {onSave && selected !== 'all' && (
          <Pressable
            style={[styles.saveButton, { borderColor: theme.accentAction }]}
            onPress={onSave}
            accessibilityLabel="Save this filter"
          >
            <Ionicons name="bookmark-outline" size={14} color={theme.accentAction} />
            <Text style={[styles.saveText, { color: theme.accentAction }]}>Save</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(FilterChips);

type ChipProps = {
  option: ChipOption;
  active: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Chip = memo(function Chip({ option, active, theme, onPress }: ChipProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(active ? 1.05 : 1, { damping: 14 }) }],
  }));

  const bgColor = active
    ? (option.color ?? theme.accentAction)
    : theme.cardBackground;

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        { backgroundColor: bgColor, borderColor: active ? bgColor : theme.cardBorder },
        animatedStyle,
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: active }}
    >
      {option.color && !active && (
        <View style={[styles.colorDot, { backgroundColor: option.color }]} />
      )}
      <Text style={[styles.chipText, { color: active ? Palette.white : theme.textPrimary }]}>
        {option.label}
      </Text>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  colorDot: {
    borderRadius: BorderRadius.pill,
    height: 8,
    width: 8,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
