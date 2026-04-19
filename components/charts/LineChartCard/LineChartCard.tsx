import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type LineItem = {
  value: number;
  label: string;
};

type Props = {
  title: string;
  data: LineItem[];
  color?: string;
  /** Optional second series — renders as a parallel line via gifted-charts `data2`. */
  data2?: LineItem[];
  color2?: string;
  /** Legend labels for the two series (only shown when data2 is provided). */
  label1?: string;
  label2?: string;
};

export default function LineChartCard({
  title,
  data,
  color,
  data2,
  color2,
  label1,
  label2,
}: Props) {
  const theme = useAppTheme();
  const lineColor = color ?? Palette.coral;
  const line2Color = color2 ?? Palette.skyBlue;
  const hasSecond = Array.isArray(data2) && data2.length > 0;

  if (data.length === 0) {
    return (
      <View
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        accessibilityRole="image"
        accessibilityLabel={`${title} line chart — no data`}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data to display yet.</Text>
      </View>
    );
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const trend = last > first ? 'trending up' : last < first ? 'trending down' : 'flat';
  const a11y = hasSecond
    ? `${title} line chart — ${data.length} points. ${label1 ?? 'Series 1'} ${trend} from ${first} to ${last}. ${label2 ?? 'Series 2'} latest ${data2![data2!.length - 1]?.value ?? 0}.`
    : `${title} line chart — ${data.length} points, ${trend} from ${first} to ${last}`;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={a11y}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

      {hasSecond ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: lineColor }]} />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
              {label1 ?? 'Series 1'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: line2Color }]} />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
              {label2 ?? 'Series 2'}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          {...(hasSecond ? { data2 } : {})}
          color={lineColor}
          color2={line2Color}
          thickness={3}
          dataPointsColor={lineColor}
          dataPointsColor2={line2Color}
          dataPointsRadius={4}
          dataPointsRadius2={4}
          noOfSections={4}
          yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          hideRules={false}
          rulesColor={theme.cardBorder}
          areaChart={!hasSecond}
          startFillColor={lineColor}
          startOpacity={0.2}
          endOpacity={0.02}
          curved
          isAnimated
          animationDuration={800}
          pointerConfig={{
            pointerStripHeight: 180,
            pointerStripColor: theme.cardBorder,
            pointerStripWidth: 2,
            pointerColor: lineColor,
            radius: 5,
            pointerLabelWidth: 130,
            pointerLabelHeight: hasSecond ? 58 : 42,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value: number; label?: string }[]) => {
              const labelText = items[0]?.label ?? '';
              return (
                <View
                  style={[
                    styles.tooltip,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                  ]}
                >
                  <Text style={[styles.tooltipLabel, { color: theme.textSecondary }]}>
                    {labelText}
                  </Text>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.legendDot, { backgroundColor: lineColor }]} />
                    <Text style={[styles.tooltipValue, { color: theme.textPrimary }]}>
                      {label1 ?? 'Series 1'}: {items[0]?.value ?? 0}
                    </Text>
                  </View>
                  {hasSecond ? (
                    <View style={styles.tooltipRow}>
                      <View style={[styles.legendDot, { backgroundColor: line2Color }]} />
                      <Text style={[styles.tooltipValue, { color: theme.textPrimary }]}>
                        {label2 ?? 'Series 2'}: {items[1]?.value ?? 0}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            },
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
  tooltip: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Shadows.sm,
  },
  tooltipLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
