import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Spacing, BorderRadius, Shadows } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

type BarItem = {
  value: number;
  label: string;
  frontColor: string;
};

type Props = {
  title: string;
  data: BarItem[];
};

export default function BarChartCard({ title, data }: Props) {
  const theme = useAppTheme();

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

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="image"
      accessibilityLabel={`${title} bar chart — ${data.length} bars, total ${total}, highest ${peak.label} at ${peak.value}`}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
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
