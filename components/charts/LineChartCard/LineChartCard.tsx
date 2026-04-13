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
};

export default function LineChartCard({ title, data, color }: Props) {
  const theme = useAppTheme();
  const lineColor = color ?? Palette.coral;

  if (data.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data to display yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          color={lineColor}
          thickness={3}
          dataPointsColor={lineColor}
          dataPointsRadius={4}
          noOfSections={4}
          yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          hideRules={false}
          rulesColor={theme.cardBorder}
          areaChart
          startFillColor={lineColor}
          startOpacity={0.2}
          endOpacity={0.02}
          curved
          isAnimated
          animationDuration={800}
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
    marginBottom: Spacing.md,
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
