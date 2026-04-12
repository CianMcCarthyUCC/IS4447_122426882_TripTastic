import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Colors, Spacing, BorderRadius } from '@/constants';

type BarItem = {
  value: number;
  label: string;
  frontColor: string;
};

type Props = {
  title: string;
  data: BarItem[];
};

/**
 * Reusable bar chart card — themed wrapper around gifted-charts BarChart.
 * Shows aggregated data per period with the app's colour palette.
 */
export default function BarChartCard({ title, data }: Props) {
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
        <BarChart
          data={data}
          barWidth={28}
          spacing={16}
          roundedTop
          roundedBottom
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules={false}
          rulesColor={Colors.cardBorder}
          barBorderRadius={6}
          isAnimated
          animationDuration={600}
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
