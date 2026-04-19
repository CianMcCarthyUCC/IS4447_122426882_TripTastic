import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type BarItem = {
  value: number;
  label: string;
  frontColor: string;
};

type Props = {
  title: string;
  data: BarItem[];
  /** Suffix appended to the highlight pill's value, e.g. "m" for minutes. */
  valueSuffix?: string;
};

export default function BarChartCard({ title, data, valueSuffix = '' }: Props) {
  const theme = useAppTheme();
  // Index of the currently-selected bar, or null if none. Tapping the
  // same bar twice clears — mirrors the "toggle-on-tap" convention
  // users expect from interactive legends.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        accessibilityRole="image"
        accessibilityLabel={`${title} bar chart — no data`}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data to display yet.</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  const selected = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={`${title} bar chart — ${data.length} bars, total ${total}${valueSuffix}, highest ${peak.label} at ${peak.value}${valueSuffix}`}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {selected ? (
          <View style={[styles.pill, { backgroundColor: Palette.coral }]}>
            <Text style={styles.pillText}>
              {selected.label}: {selected.value}
              {valueSuffix}
            </Text>
          </View>
        ) : (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>Tap a bar</Text>
        )}
      </View>
      <View style={styles.chartWrapper}>
        <BarChart
          data={data}
          barWidth={28}
          spacing={16}
          roundedTop
          roundedBottom
          noOfSections={4}
          yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          hideRules={false}
          rulesColor={theme.cardBorder}
          barBorderRadius={6}
          isAnimated
          animationDuration={600}
          focusBarOnPress
          focusedBarConfig={{ color: Palette.coral }}
          onPress={(_item: BarItem, index: number) => {
            setSelectedIndex((prev) => (prev === index ? null : index));
          }}
        />
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
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
    fontWeight: '700',
  },
  pill: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  pillText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});
