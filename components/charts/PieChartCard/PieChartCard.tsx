import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type PieItem = {
  value: number;
  color: string;
  /** Short label shown inside the slice (e.g. "32%"). */
  text: string;
  /** Full category name shown in the legend row. */
  name: string;
};

type Props = {
  title: string;
  data: PieItem[];
  /** Suffix appended to value readouts in the center + legend (e.g. "m"). */
  valueSuffix?: string;
};

/**
 * Interactive donut chart. Tap a slice to focus it — the center label
 * and legend highlight sync to the focused slice; tap again to clear.
 *
 * Uses the gifted-charts `focusOnPress` machinery so we don't have to
 * hand-roll slice geometry / hit-testing.
 */
export default function PieChartCard({ title, data, valueSuffix = 'm' }: Props) {
  const theme = useAppTheme();
  // `focused` is the index of the currently selected slice, or null.
  // We track it ourselves (in addition to gifted-charts' internal
  // focus state) so the center label + legend row can react.
  const [focused, setFocused] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        accessibilityRole="image"
        accessibilityLabel={`${title} donut chart — no data`}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data to display yet.</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const focusedSlice = focused !== null ? data[focused] : null;
  const a11yBreakdown = data
    .map((d) => `${d.name} ${d.value}${valueSuffix}`)
    .join(', ');

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={`${title} donut chart — total ${total}${valueSuffix}. ${a11yBreakdown}.`}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {focusedSlice ? (
          <Pressable
            onPress={() => setFocused(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear category focus"
          >
            <Text style={[styles.clearLink, { color: Palette.coral }]}>Clear</Text>
          </Pressable>
        ) : (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>Tap a slice</Text>
        )}
      </View>

      <View style={styles.chartWrapper}>
        <PieChart
          data={data}
          donut
          radius={90}
          innerRadius={55}
          focusOnPress
          sectionAutoFocus
          showText
          textColor={Palette.white}
          textSize={11}
          fontWeight="700"
          innerCircleColor={theme.cardBackground}
          onPress={(_item: PieItem, index: number) => {
            setFocused((prev) => (prev === index ? null : index));
          }}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={[styles.centerValue, { color: theme.textPrimary }]}>
                {focusedSlice ? focusedSlice.value : total}
                {valueSuffix}
              </Text>
              <Text style={[styles.centerLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                {focusedSlice ? focusedSlice.name : 'Total'}
              </Text>
            </View>
          )}
        />
      </View>

      <View style={styles.legend}>
        {data.map((d, i) => {
          const isFocused = focused === i;
          return (
            <Pressable
              key={`${d.name}-${i}`}
              onPress={() => setFocused((prev) => (prev === i ? null : i))}
              style={[
                styles.legendRow,
                isFocused && { backgroundColor: theme.tagBackground },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Focus ${d.name}, ${d.value}${valueSuffix}`}
            >
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text
                style={[
                  styles.legendName,
                  { color: theme.textPrimary },
                  isFocused && styles.legendNameFocused,
                ]}
                numberOfLines={1}
              >
                {d.name}
              </Text>
              <Text style={[styles.legendValue, { color: theme.textSecondary }]}>
                {d.value}
                {valueSuffix}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  clearLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 90,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  legendRow: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flexBasis: '48%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  legendNameFocused: {
    fontWeight: '800',
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});
