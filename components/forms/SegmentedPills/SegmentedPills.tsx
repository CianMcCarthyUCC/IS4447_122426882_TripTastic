import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

export type SegmentOption<V extends string = string> = {
  label: string;
  value: V;
};

type Props<V extends string> = {
  options: ReadonlyArray<SegmentOption<V>>;
  selected: V;
  onSelect: (value: V) => void;
  accessibilityLabel?: string;
};

/**
 * Pill-track segmented control — sand background with a white "active" pill.
 * Keeps parity with iOS segmented feel while matching the reference design.
 * Purely presentational: parent owns state, this just renders + dispatches.
 */
function SegmentedPillsInner<V extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel = 'Sections',
}: Props<V>) {
  const theme = useAppTheme();

  return (
    <View
      style={[styles.track, { backgroundColor: theme.segmentTrack }]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Segment
            key={opt.value}
            label={opt.label}
            active={active}
            theme={theme}
            onPress={() => onSelect(opt.value)}
          />
        );
      })}
    </View>
  );
}

const SegmentedPills = memo(SegmentedPillsInner) as typeof SegmentedPillsInner;
export default SegmentedPills;

type SegmentProps = {
  label: string;
  active: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
};

const Segment = memo(function Segment({ label, active, theme, onPress }: SegmentProps) {
  // useCallback isn't useful here since onPress is a fresh closure from the
  // parent's render anyway — Segment is memoised on `onPress` identity.
  const handlePress = useCallback(() => onPress(), [onPress]);
  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.segment,
        active && [styles.segmentActive, { backgroundColor: theme.segmentPillActive }],
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          { color: active ? theme.textPrimary : theme.textSecondary },
          active && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  track: {
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    padding: Spacing.xs,
  },
  segment: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  segmentActive: {
    ...Shadows.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '700',
  },
});
