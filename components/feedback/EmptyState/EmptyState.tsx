import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  title: string;
  message?: string;
  /** Show the pulsing illustration above the title */
  showAnimation?: boolean;
  /** Example searches or suggestions shown below the message */
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  /** Optional action button */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Rich empty state with an illustration, suggestions, and action button.
 * The illustration is a Reanimated-driven pulse on a travel-themed Ionicon —
 * a lightweight stand-in for the former looping Lottie animation, runs on
 * the UI thread, ships no extra asset weight.
 */
export default function EmptyState({
  title,
  message,
  showAnimation = true,
  suggestions,
  onSuggestionPress,
  actionLabel,
  onAction,
}: Props) {
  const theme = useAppTheme();

  // Gentle infinite scale-pulse — replicates the "something alive here" feel
  // of the old looping Lottie without committing to a specific narrative.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!showAnimation) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse, showAnimation]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {showAnimation && (
        <Animated.View style={[styles.animation, pulseStyle]}>
          <Ionicons name="compass-outline" size={96} color={theme.accentAction} />
        </Animated.View>
      )}

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      {message ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      ) : null}

      {suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
            Try searching for:
          </Text>
          <View style={styles.suggestionsRow}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                style={[styles.suggestionChip, { backgroundColor: theme.tagBackground }]}
                onPress={() => onSuggestionPress?.(s)}
                accessibilityLabel={`Search for ${s}`}
                accessibilityRole="button"
              >
                <Text style={[styles.suggestionText, { color: theme.accentAction }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {actionLabel && onAction && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.accentAction }]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  animation: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    width: 120,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    textAlign: 'center',
  },
  suggestionsContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  suggestionChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  actionText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
