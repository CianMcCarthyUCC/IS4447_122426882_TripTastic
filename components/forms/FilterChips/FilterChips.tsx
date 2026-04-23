import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHaptics } from '@/hooks/useHaptics';

export type ChipOption = {
  label: string;
  value: string;
  color?: string;
  // Ionicons glyph rendered tinted in `colour` for the inactive state,
  // white for the active state. Used to carry each category's stored icon.
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  onSave?: () => void;
  accessibilityLabel?: string;
};

/**
 * The row of filter chips used on list screens. Each chip represents an
 * option (such as a category) the user can tap to filter the list; an
 * optional save button pins the current filter for next time.
 */
function FilterChips({ options, selected, onSelect, onSave, accessibilityLabel = 'Filter' }: Props) {
  const theme = useAppTheme();
  const haptics = useHaptics();

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
            onPress={() => { haptics.light(); onSelect(opt.value); }}
          />
        ))}

        {onSave && selected !== 'all' && (
          <Pressable
            style={[styles.saveButton, { borderColor: theme.accentAction }]}
            onPress={() => { haptics.light(); onSave(); }}
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

const Chip = memo(function Chip({ option, active, theme, onPress }: ChipProps) {
  const bgColor = active
    ? (option.color ?? theme.accentAction)
    : theme.cardBackground;

  return (
    <Pressable
      style={[
        styles.chip,
        { backgroundColor: bgColor, borderColor: active ? bgColor : theme.cardBorder },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ selected: active }}
    >
      {option.icon ? (
        <Ionicons
          name={option.icon}
          size={14}
          color={active ? Palette.white : (option.color ?? theme.textPrimary)}
        />
      ) : option.color && !active ? (
        <View style={[styles.colorDot, { backgroundColor: option.color }]} />
      ) : null}
      <Text style={[styles.chipText, { color: active ? Palette.white : theme.textPrimary }]}>
        {option.label}
      </Text>
    </Pressable>
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
