import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type PieItem = {
  value: number;
  color: string;
  /** Short label shown inside the slice (e.g. "32%"). */
  text: string;
  /** Full category name shown in the legend row. */
  name: string;
  /** Ionicons name rendered in the legend in place of a colour swatch. */
  icon?: string;
};

type Props = {
  title: string;
  data: PieItem[];
  /** Suffix appended to value readouts in the centre + legend (e.g. "m"). */
  valueSuffix?: string;
};

/**
 * The interactive donut chart used on the Insights tab. Tapping a slice
 * highlights it and brings its value into the centre so the user can
 * dig into the breakdown; tapping again returns to the full view.
 */
export default function PieChartCard({ title, data, valueSuffix = 'm' }: Props) {
  const theme = useAppTheme();
  // `focused` is the index of the currently selected slice, or null.
  // We track it ourselves (in addition to gifted-charts' internal
  // focus state) so the centre label + legend row can react.
  const [focused, setFocused] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={[styles.card, { borderBottomColor: theme.cardBorder }]}
        accessibilityRole="image"
        accessibilityLabel={`${title} donut chart - no data`}
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
      style={[styles.card, { borderBottomColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={`${title} donut chart - total ${total}${valueSuffix}. ${a11yBreakdown}.`}
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
          data={data.map((d, i) => ({
            ...d,
            focused: focused === i,
            textColor: theme.textPrimary,
            // Only render the slice's percent label when it's the focused
            // one, and strip it down to just the number so the category
            // name doesn't repeat what the legend + centre already say.
            text: focused === i ? `${Math.round((d.value / total) * 100)}%` : '',
          }))}
          donut
          radius={90}
          innerRadius={55}
          focusOnPress
          sectionAutoFocus={false}
          showText
          textColor={theme.textPrimary}
          textSize={11}
          fontWeight="700"
          labelsPosition="outward"
          showValuesAsLabels={false}
          extraRadius={8}
          innerCircleColor={theme.screenBackground}
          onPress={(_item: PieItem, index: number) => {
            setFocused((prev) => (prev === index ? null : index));
          }}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={[styles.centerValue, { color: theme.textPrimary }]}>
                {focusedSlice ? focusedSlice.value : total}
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
              <Ionicons
                name={(d.icon as keyof typeof Ionicons.glyphMap) ?? 'ellipse'}
                size={14}
                color={d.color}
                style={styles.legendIcon}
              />
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
  // Flat: no card chrome, just a bottom hairline so sibling charts
  // separate cleanly on the Insights tab.
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
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
    overflow: 'visible',
    paddingHorizontal: Spacing.xl,
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
  legendIcon: {
    width: 16,
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
