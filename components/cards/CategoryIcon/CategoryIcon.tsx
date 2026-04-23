import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Palette } from '@/constants';
import type { Category } from '@/types';

type Props = {
  category: Pick<Category, 'icon' | 'color'>;
  size?: number;
  variant?: 'plain' | 'bubble';
};

/**
 * The small icon badge that represents a category everywhere it appears in
 * the app. Comes in two looks: a plain tinted icon for chips and list rows,
 * and a filled circle with a white icon for use as a hero marker on cards.
 */
function CategoryIconInner({ category, size = 14, variant = 'plain' }: Props) {
  const iconName = (category.icon as keyof typeof Ionicons.glyphMap) ?? 'ellipse';

  if (variant === 'bubble') {
    const bubbleSize = size;
    const iconSize = Math.round(size * 0.55);
    return (
      <View
        style={[
          styles.bubble,
          { backgroundColor: category.color, width: bubbleSize, height: bubbleSize },
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color={Palette.white} />
      </View>
    );
  }

  return <Ionicons name={iconName} size={size} color={category.color} />;
}

export const CategoryIcon = memo(CategoryIconInner);

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
  },
});
