import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  /** Copy inside the chip — short, e.g. "Focus: Food this week". */
  label: string;
  /** Tap handler — applies the suggested filter state. */
  onApply: () => void;
  /** Long-press handler — dismisses the chip for the rest of the session. */
  onDismiss: () => void;
};

/**
 * "💡 Try: ..." chip surfaced above a list when a rule-based filter
 * suggestion is available. Tap to apply, long-press to dismiss for the
 * session. Kept intentionally small — the entire thing is one pill of
 * coral-tinted copy so it reads as a nudge, not a primary action.
 */
function SuggestionChip({ label, onApply, onDismiss }: Props) {
  const theme = useAppTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
    >
      <Pressable
        onPress={onApply}
        onLongPress={onDismiss}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={`Try filter: ${label}. Long-press to dismiss.`}
        style={({ pressed }) => [
          styles.chip,
          { backgroundColor: theme.tagBackground },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="bulb" size={14} color={theme.accentAction} />
        <Text style={[styles.label, { color: theme.textPrimary }]} numberOfLines={1}>
          Try: {label}
        </Text>
        <View style={styles.hint}>
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>hold to dismiss</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(SuggestionChip);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  chip: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    marginLeft: 'auto',
  },
  hintText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
