import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants';

type ToastVariant = 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide: () => void;
};

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const BG_COLORS: Record<ToastVariant, string> = {
  success: Colors.successAction,
  error: Colors.dangerAction,
  info: Colors.primaryAction,
};

/**
 * Animated toast notification — slides in from top, auto-hides.
 * Provides user feedback for CRUD operations.
 */
function Toast({
  visible,
  message,
  variant = 'success',
  duration = 2500,
  onHide,
}: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.delay(duration),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    } else {
      translateY.setValue(-100);
    }
  }, [visible, duration, onHide, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: BG_COLORS[variant], transform: [{ translateY }] },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons name={ICONS[variant]} size={20} color={Colors.textButton} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export default memo(Toast);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    left: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    position: 'absolute',
    right: Spacing.xl,
    top: 60,
    zIndex: 9999,
  },
  text: {
    color: Colors.textButton,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
