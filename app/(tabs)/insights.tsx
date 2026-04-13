import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInsightsData, useActivities, useCategories, useAppTheme } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { ViewModeToggle } from '@/components/forms';
import { BarChartCard, LineChartCard, ProgressCard } from '@/components/charts';
import { StatsRow } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { Spacing } from '@/constants';
import type { ViewMode } from '@/types';

/**
 * Insights tab — stat row + charts + target progress.
 */
export default function InsightsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const { barChartData, lineChartData, categoryBarData, progressData } = useInsightsData(viewMode);
  const { activities } = useActivities();
  const { categories } = useCategories();
  const theme = useAppTheme();

  const totalMinutes = useMemo(
    () => activities.reduce((sum, a) => sum + a.metric, 0),
    [activities],
  );

  return (
    <ScreenContainer withTabs>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your trip at a glance
        </Text>
      </View>

      <StatsRow stats={[
        { label: 'Total', value: `${totalMinutes}m`, icon: 'time' },
        { label: 'Activities', value: String(activities.length), icon: 'list' },
        { label: 'Categories', value: String(categories.length), icon: 'grid' },
      ]} />

      <ViewModeToggle selected={viewMode} onSelect={setViewMode} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <BarChartCard title={`Activity Totals (${viewMode})`} data={barChartData} />
        <LineChartCard title="Cumulative Trend" data={lineChartData} />
        <BarChartCard title="By Category" data={categoryBarData} />

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Target Progress</Text>
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
            title="No goals set"
            message="Set goals in the Goals tab to track your trip progress here."
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
