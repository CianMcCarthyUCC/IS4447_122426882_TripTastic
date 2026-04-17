import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInsightsData, useActivities, useCategories, useTargets, useAppTheme, useCategoryLookup } from '@/hooks';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { ViewModeToggle } from '@/components/forms';
import { BarChartCard, LineChartCard, ProgressCard } from '@/components/charts';
import { StatsRow, StreakCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { Spacing, SharedStyles } from '@/constants';
import { computeStreaks } from '@/utils/streakCalculator';
import type { ViewMode } from '@/types';

/**
 * Insights tab — stat row + charts + target progress.
 */
export default function InsightsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const { barChartData, lineChartData, categoryBarData, progressData } = useInsightsData(viewMode);
  const { activities } = useActivities();
  const { categories } = useCategories();
  const { targets } = useTargets();
  const theme = useAppTheme();

  const totalMinutes = useMemo(
    () => activities.reduce((sum, a) => sum + a.metric, 0),
    [activities],
  );

  const categoryLookup = useCategoryLookup(categories);

  const streaks = useMemo(
    () => computeStreaks(activities, targets, categoryLookup),
    [activities, targets, categoryLookup],
  );

  return (
    <ScreenContainer withTabs>
      <ScreenHeader title="Insights" subtitle="Your trip at a glance" />

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

        <Text style={[SharedStyles.sectionTitle, { color: theme.textPrimary }]}>Target Progress</Text>
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

        {/* Streak tracking */}
        <Text style={[SharedStyles.sectionTitle, { color: theme.textPrimary }]}>Activity Streaks</Text>
        {streaks.length > 0 ? (
          streaks.map((s) => <StreakCard key={s.categoryId} streak={s} />)
        ) : (
          <EmptyState
            title="No streaks yet"
            message="Log activities on consecutive days to build streaks!"
            showAnimation={false}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
