import { memo, useCallback, Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

export type SegmentOption<V extends string = string> = {
  label: string;
  value: V;
};

export type SegmentedPillsVariant = 'pill' | 'divided';

type Props<V extends string> = {
  options: ReadonlyArray<SegmentOption<V>>;
  selected: V;
  onSelect: (value: V) => void;
  accessibilityLabel?: string;
  /**
   * When true, the active pill uses the accent (orange) colour with
   * white text - used on filter surfaces where the selection also drives
   * a filtered result, so the colour reinforces "this is filtering".
   * Only applies to the `pill` variant.
   */
  accentActive?: boolean;
  /**
   * `pill` (default) - the sand-coloured track with a white active pill,
   * used for inline filter toggles. `divided` - a flat tab-style row
   * with thin vertical dividers between each segment, used for switching
   * between sections of a screen.
   */
  variant?: SegmentedPillsVariant;
};

/**
 * The app's segmented control. Picks between two looks: the filled pill
 * track used for inline filter toggles, and a flat divided row used for
 * top-level section switching (Activities / Goals / Discover Places).
 */
function SegmentedPillsInner<V extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel = 'Sections',
  accentActive = false,
  variant = 'pill',
}: Props<V>) {
  const theme = useAppTheme();
  const isDivided = variant === 'divided';

  return (
    <View
      style={[
        isDivided ? styles.dividedTrack : styles.track,
        !isDivided && { backgroundColor: theme.segmentTrack },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((opt, i) => {
        const active = opt.value === selected;
        return (
          <Fragment key={opt.value}>
            {isDivided && i > 0 ? (
              <View
                style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : null}
            <Segment
              label={opt.label}
              active={active}
              accentActive={accentActive}
              variant={variant}
              theme={theme}
              onPress={() => onSelect(opt.value)}
            />
          </Fragment>
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
  accentActive: boolean;
  variant: SegmentedPillsVariant;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
};

const Segment = memo(function Segment({
  label,
  active,
  accentActive,
  variant,
  theme,
  onPress,
}: SegmentProps) {
  const handlePress = useCallback(() => onPress(), [onPress]);
  const isDivided = variant === 'divided';

  if (isDivided) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.dividedSegment,
          pressed && styles.dividedSegmentPressed,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <Text
          style={[
            styles.label,
            {
              // Inactive segments use the primary text colour so they read
              // as real buttons rather than faded labels - the active one
              // then stands out via weight + underline instead of colour.
              color: theme.textPrimary,
              fontWeight: active ? '800' : '600',
              opacity: active ? 1 : 0.75,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {active ? (
          <View style={[styles.activeUnderline, { backgroundColor: theme.accentAction }]} />
        ) : null}
      </Pressable>
    );
  }

  const activeBg = accentActive ? theme.accentAction : theme.segmentPillActive;
  const activeTextColor = accentActive ? Palette.white : theme.textPrimary;
  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.segment,
        active && [styles.segmentActive, { backgroundColor: activeBg }],
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          { color: active ? activeTextColor : theme.textSecondary },
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
  dividedTrack: {
    alignItems: 'stretch',
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  dividedSegment: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  dividedSegmentPressed: {
    opacity: 0.55,
  },
  dividerLine: {
    alignSelf: 'center',
    height: 20,
    width: 1,
  },
  activeUnderline: {
    borderRadius: 1,
    bottom: 0,
    height: 2,
    position: 'absolute',
    width: '60%',
  },
});
