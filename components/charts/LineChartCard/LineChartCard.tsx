import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, Spacing, BorderRadius } from '@/constants';

type LineItem = {
  value: number;
  label: string;
};

type Props = {
  title: string;
  data: LineItem[];
  color?: string;
};

/**
 * Reusable line chart card — themed wrapper around gifted-charts LineChart.
 * Shows cumulative or trend data with optional area fill.
 */
export default function LineChartCard({
  title,
  data,
  color = Colors.primaryAction,
}: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>No data to display yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          color={color}
          thickness={3}
          dataPointsColor={color}
          dataPointsRadius={4}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules={false}
          rulesColor={Colors.cardBorder}
          areaChart
          startFillColor={color}
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
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  axisText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  empty: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
