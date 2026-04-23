import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Callout } from '@/components/feedback';
import {
  BAR_FADED_COLORS,
  BAR_LOGGED_COLOR,
  BAR_PLANNED_COLOR,
} from '@/hooks/useInsightsData';
import type { BarDataItem } from '@/hooks/useInsightsData';

const BAR_SPACING = 16;
// gifted-charts' default y-axis label column + a 1px axis line. Used to
// offset the tooltip so it lines up with the centre of the selected bar.
const Y_AXIS_OFFSET = 35 + 1;
const TOOLTIP_HALF_WIDTH = 48;

// Narrow windows (weekly/monthly with 4 bars) look anaemic at the daily
// width, so widen the bars when we've got fewer of them to fill the
// chart more generously.
function barWidthFor(count: number): number {
  if (count <= 4) return 52;
  if (count <= 5) return 42;
  if (count <= 6) return 34;
  return 28;
}

function barCenterX(index: number, barWidth: number): number {
  return Y_AXIS_OFFSET + BAR_SPACING + index * (barWidth + BAR_SPACING) + barWidth / 2;
}

type Props = {
  title: string;
  /** Each bar contains a stack of logged + planned minutes. */
  data: BarDataItem[];
  valueSuffix?: string;
  subtitle?: string;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  /**
   * Replaces the plain "No data" fallback when every bar in the current
   * window is empty. Use this to plug in a branded empty state with a
   * call to action (e.g. "Log an activity").
   */
  emptyComponent?: React.ReactElement | null;
  /**
   * Optional controlled selection. When provided, the parent owns the
   * selected bar so it can dismiss the tooltip from outside (e.g. when
   * the user scrolls or taps off the chart).
   */
  selectedIndex?: number | null;
  onSelectIndex?: (index: number | null) => void;
};

/**
 * The Insights bar chart. Every bar is a two-part stack - logged
 * minutes (coral) on the bottom, planned minutes (grey) on top - so a
 * day with a mix of the two reads as a single multi-colour column.
 * Tapping a bar highlights it and fades every other bar so the user
 * can focus on one slot at a time.
 */
export default function BarChartCard({
  title,
  data,
  valueSuffix = '',
  subtitle,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  emptyComponent,
  selectedIndex: controlledSelectedIndex,
  onSelectIndex,
}: Props) {
  const theme = useAppTheme();
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number | null>(null);
  const isControlled = controlledSelectedIndex !== undefined;
  const selectedIndex = isControlled ? controlledSelectedIndex : internalSelectedIndex;
  const setSelectedIndex = (next: number | null) => {
    if (isControlled) onSelectIndex?.(next);
    else setInternalSelectedIndex(next);
  };

  // Re-paint each stack based on the current selection: the active bar
  // keeps its full-strength colours, every other bar drops to the faded
  // versions. When nothing is selected, every bar is at full strength.
  const stackData = useMemo(
    () =>
      data.map((d, i) => {
        const faded = selectedIndex !== null && i !== selectedIndex;
        return {
          label: d.label,
          stacks: d.stacks.map((s, j) => ({
            value: s.value,
            color: faded
              ? j === 0
                ? BAR_FADED_COLORS.logged
                : BAR_FADED_COLORS.planned
              : s.color,
          })),
        };
      }),
    [data, selectedIndex],
  );

  const totals = useMemo(() => data.map((d) => stackSum(d)), [data]);
  const hasData = totals.some((t) => t > 0);
  const total = totals.reduce((sum, t) => sum + t, 0);
  const peakIndex = indexOfMax(totals);
  const peak = peakIndex >= 0 ? data[peakIndex] : null;

  const barWidth = barWidthFor(data.length);

  const selected = selectedIndex !== null ? data[selectedIndex] : null;
  const selectedLogged = selected?.stacks[0]?.value ?? 0;
  const selectedPlanned = selected?.stacks[1]?.value ?? 0;

  return (
    <View
      style={[styles.card, { borderBottomColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={
        hasData
          ? `${title} bar chart - ${data.length} bars, total ${total}${valueSuffix ? ` ${valueSuffix}` : ''}, highest ${peak!.label} at ${totals[peakIndex]}${valueSuffix ? ` ${valueSuffix}` : ''}`
          : `${title} bar chart - no data`
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onBack || onForward ? (
          <View style={styles.navRow}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                disabled={!canGoBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Previous period"
                accessibilityState={{ disabled: !canGoBack }}
                style={({ pressed }) => [
                  styles.navBtn,
                  { borderColor: theme.cardBorder },
                  !canGoBack && styles.navBtnDisabled,
                  pressed && canGoBack && styles.navBtnPressed,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={canGoBack ? theme.textPrimary : theme.textSecondary}
                />
              </Pressable>
            ) : null}
            {onForward ? (
              <Pressable
                onPress={onForward}
                disabled={!canGoForward}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Next period"
                accessibilityState={{ disabled: !canGoForward }}
                style={({ pressed }) => [
                  styles.navBtn,
                  { borderColor: theme.cardBorder },
                  !canGoForward && styles.navBtnDisabled,
                  pressed && canGoForward && styles.navBtnPressed,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={canGoForward ? theme.textPrimary : theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Legend for the two stack segments. */}
      <View style={styles.legendRow}>
        <View style={styles.legendEntry}>
          <View style={[styles.legendSwatch, { backgroundColor: BAR_LOGGED_COLOR }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Logged</Text>
        </View>
        <View style={styles.legendEntry}>
          <View style={[styles.legendSwatch, { backgroundColor: BAR_PLANNED_COLOR }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Planned</Text>
        </View>
      </View>

      {!selected && hasData ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Tap a bar to focus it
        </Text>
      ) : null}

      {hasData ? (
        <View style={styles.chartWrapper}>
          {selected ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.tooltipLayer,
                { left: barCenterX(selectedIndex!, barWidth) - TOOLTIP_HALF_WIDTH },
              ]}
            >
              <Callout
                tone="dark"
                compact
                eyebrow="Total"
                primaryValue={String(selectedLogged + selectedPlanned)}
                primaryUnit={valueSuffix || undefined}
                subtitle={selected.label}
                onDismiss={() => setSelectedIndex(null)}
                dismissLabel="Clear bar selection"
              />
            </View>
          ) : null}
          <BarChart
            stackData={stackData}
            barWidth={barWidth}
            spacing={BAR_SPACING}
            initialSpacing={BAR_SPACING}
            noOfSections={4}
            yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            hideRules={false}
            rulesColor={theme.cardBorder}
            barBorderRadius={6}
            isAnimated
            animationDuration={400}
            onPress={(_item: unknown, index: number) => {
              setSelectedIndex(selectedIndex === index ? null : index);
            }}
          />
        </View>
      ) : emptyComponent ? (
        emptyComponent
      ) : (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data to display yet.</Text>
      )}
    </View>
  );
}

function stackSum(item: BarDataItem): number {
  return item.stacks.reduce((s, seg) => s + seg.value, 0);
}

function indexOfMax(values: number[]): number {
  let maxIdx = -1;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) {
      max = values[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleCol: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  navBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnPressed: {
    opacity: 0.6,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendEntry: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendSwatch: {
    borderRadius: 3,
    height: 10,
    width: 10,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipLayer: {
    position: 'absolute',
    top: -4,
    zIndex: 10,
  },
  hint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  chartWrapper: {
    alignItems: 'flex-start',
    overflow: 'visible',
    position: 'relative',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});
