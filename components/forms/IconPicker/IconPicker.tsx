import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Spacing, BorderRadius, SharedStyles, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

/** Travel-relevant Ionicons for category selection */
const ICON_OPTIONS: Array<keyof typeof Ionicons.glyphMap> = [
  'eye', 'restaurant', 'car', 'bed', 'cart',
  'airplane', 'map', 'compass', 'camera', 'walk',
  'bicycle', 'bus', 'train', 'boat', 'cafe',
  'wine', 'beer', 'pizza', 'fish', 'leaf',
  'sunny', 'umbrella', 'snow', 'water',
  'musical-notes', 'ticket', 'gift', 'heart',
  'star', 'flag', 'trophy', 'fitness',
];

type Props = {
  label?: string;
  selectedIcon: string;
  accentColor?: string;
  onSelect: (icon: string) => void;
};

/**
 * Visual icon picker — grid of Ionicons to tap-select.
 * Replaces raw text input for icon names.
 * Uses Reanimated for spring-animated selection.
 */
function IconPicker({ label = 'Icon', selectedIcon, accentColor, onSelect }: Props) {
  const theme = useAppTheme();

  return (
    <View style={SharedStyles.fieldWrapper}>
      <Text style={[SharedStyles.fieldLabel, { color: theme.textLabel }]}>{label}</Text>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Select an icon">
        {ICON_OPTIONS.map((icon) => (
          <IconSwatch
            key={icon}
            icon={icon}
            selected={selectedIcon === icon}
            accentColor={accentColor ?? theme.accentAction}
            theme={theme}
            onPress={() => onSelect(icon)}
          />
        ))}
      </View>
    </View>
  );
}

export default memo(IconPicker);

type SwatchProps = {
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  accentColor: string;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IconSwatch = memo(function IconSwatch({ icon, selected, accentColor, theme, onPress }: SwatchProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.1 : 1, { damping: 12 }) }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.swatch,
        { backgroundColor: selected ? accentColor : theme.tagBackground },
        animatedStyle,
      ]}
      accessibilityRole="radio"
      accessibilityLabel={icon}
      accessibilityState={{ selected }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={selected ? Palette.white : theme.textSecondary}
      />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
