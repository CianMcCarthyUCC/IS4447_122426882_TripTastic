import { memo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
};

/**
 * Swipeable row wrapper — swipe left to reveal delete/edit actions.
 * Uses react-native-gesture-handler's Swipeable for native-quality gesture.
 * Wrap any card or list item with this for swipe-to-action UX.
 */
function SwipeableRow({ children, onDelete, onEdit }: Props) {
  const theme = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => swipeableRef.current?.close();

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <RectButton
            style={[styles.action, { backgroundColor: theme.primaryAction }]}
            onPress={() => { close(); onEdit(); }}
            accessibilityLabel="Edit"
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons name="pencil" size={20} color={Palette.white} />
              <Text style={styles.actionText}>Edit</Text>
            </Animated.View>
          </RectButton>
        )}
        {onDelete && (
          <RectButton
            style={[styles.action, { backgroundColor: theme.dangerAction }]}
            onPress={() => { close(); onDelete(); }}
            accessibilityLabel="Delete"
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons name="trash" size={20} color={Palette.white} />
              <Text style={styles.actionText}>Delete</Text>
            </Animated.View>
          </RectButton>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

export default memo(SwipeableRow);

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  action: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  actionText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
});
