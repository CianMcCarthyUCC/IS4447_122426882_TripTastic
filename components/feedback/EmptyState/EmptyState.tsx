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

type RelaxAction = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  title: string;
  message?: string;
  /** Show the pulsing illustration above the title */
  showAnimation?: boolean;
  /** Example searches or suggestions shown below the message */
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  /** One-tap "widen this filter" chips for filter-aware empty states. */
  relaxActions?: RelaxAction[];
  relaxLabel?: string;
  /** Optional action button */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * The friendly placeholder shown when a list has nothing in it. Pairs a
 * pulsing travel icon with a title, a short message, optional suggestion
 * chips, and an optional call-to-action button.
 */
export default function EmptyState({
  title,
  message,
  showAnimation = true,
  suggestions,
  onSuggestionPress,
  relaxActions,
  relaxLabel = 'Widen a filter',
  actionLabel,
  onAction,
}: Props) {
  const theme = useAppTheme();

  // Gentle infinite scale-pulse - replicates the "something alive here" feel
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

      {relaxActions && relaxActions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
            {relaxLabel}
          </Text>
          <View style={styles.suggestionsRow}>
            {relaxActions.map((a) => (
              <Pressable
                key={a.label}
                style={[styles.relaxChip, { borderColor: theme.accentAction }]}
                onPress={a.onPress}
                accessibilityLabel={a.label}
                accessibilityRole="button"
              >
                {a.icon ? (
                  <Ionicons name={a.icon} size={14} color={theme.accentAction} />
                ) : null}
                <Text style={[styles.suggestionText, { color: theme.accentAction }]}>
                  {a.label}
                </Text>
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
  relaxChip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
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
