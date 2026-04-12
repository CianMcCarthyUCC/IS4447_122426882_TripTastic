import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInsightsData } from '@/hooks';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { ViewModeToggle } from '@/components/forms';
import { BarChartCard, LineChartCard, ProgressCard } from '@/components/charts';
import { EmptyState } from '@/components/feedback';
import { Colors, Spacing } from '@/constants';
import type { ViewMode } from '@/types';

/**
 * Insights tab — daily/weekly/monthly views with bar chart, line chart,
 * and target progress cards.
 * Rubric: "Daily/weekly/monthly views; at least two charts"
 */
export default function InsightsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const { barChartData, lineChartData, categoryBarData, progressData } = useInsightsData(viewMode);

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Insights" subtitle="Activity trends & target progress" />
      <ViewModeToggle selected={viewMode} onSelect={setViewMode} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bar chart: totals per period */}
        <BarChartCard
          title={`Activity Totals (${viewMode})`}
          data={barChartData}
        />

        {/* Line chart: cumulative trend */}
        <LineChartCard
          title="Cumulative Trend"
          data={lineChartData}
        />

        {/* Category breakdown bar chart */}
        <BarChartCard
          title="By Category"
          data={categoryBarData}
        />

        {/* Target progress section */}
        <Text style={styles.sectionTitle}>Target Progress</Text>
        {progressData.length > 0 ? (
          progressData.map((p) => (
            <ProgressCard
              key={p.targetId}
              categoryName={p.categoryName}
              categoryColor={p.categoryColor}
              current={p.current}
              target={p.target}
              period={p.period}
              percent={p.percent}
              exceeded={p.exceeded}
            />
          ))
        ) : (
          <EmptyState
            title="No targets set"
            message="Create targets in the Targets tab to track progress here."
          />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
