import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Spacing, BorderRadius, SharedStyles, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

const PRESET_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#EF4444', '#F59E0B', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#F97316', '#84CC16',
  '#A855F7', '#D946EF', '#64748B', '#0A2463',
];

type Props = {
  label?: string;
  selectedColor: string;
  onSelect: (color: string) => void;
};

/**
 * Visual colour palette picker — tap to select from preset swatches.
 * Replaces raw hex text input for a much better mobile UX.
 * Uses Reanimated for spring-animated selection feedback.
 */
function ColorPicker({ label = 'Colour', selectedColor, onSelect }: Props) {
  const theme = useAppTheme();

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]}>{label}</Text>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Select a colour">
        {PRESET_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            selected={selectedColor === color}
            onPress={() => onSelect(color)}
          />
        ))}
      </View>
      <View style={styles.preview}>
        <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
        <Text style={[styles.previewText, { color: theme.textSecondary }]}>{selectedColor}</Text>
      </View>
    </View>
  );
}

export default memo(ColorPicker);

type SwatchProps = {
  color: string;
  selected: boolean;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ColorSwatch = memo(function ColorSwatch({ color, selected, onPress }: SwatchProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.15 : 1, { damping: 12 }) }],
    borderWidth: withSpring(selected ? 3 : 0),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.swatch, { backgroundColor: color, borderColor: Palette.white }, animatedStyle]}
      accessibilityRole="radio"
      accessibilityLabel={`Colour ${color}`}
      accessibilityHint="Selects this colour"
      accessibilityState={{ selected }}
    />
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  swatch: {
    borderRadius: BorderRadius.sm,
    height: 40,
    width: 40,
  },
  preview: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  previewDot: {
    borderRadius: BorderRadius.pill,
    height: 12,
    marginRight: Spacing.sm,
    width: 12,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
