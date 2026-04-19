import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks';
import { useInsightsData } from '@/hooks/useInsightsData';
import { ViewModeToggle } from '@/components/forms';
import { StatsRow, StreakCard } from '@/components/cards';
import { BarChartCard, LineChartCard, PieChartCard } from '@/components/charts';
import { Palette, Spacing, SharedStyles } from '@/constants';
import { computeStreaks } from '@/utils/streakCalculator';
import { TripAiGuide } from './TripAiGuide';
import type { Activity, Target, Trip, ViewMode } from '@/types';

type Props = {
  /** Parent trip — passed through to the AI guide composite. */
  trip: Trip;
  activities: Activity[];
  targets: Target[];
  totalMinutes: number;
};

/**
 * Summary section of the trip detail screen — stats, bar/line/pie charts,
 * streak card, and the AI travel guide. Surfaced to the user as "Summary"
 * in the segmented pill control; the internal route name stays `insights`
 * to avoid churning unrelated code.
 *
 * This file stays intentionally lean: it owns layout order and the
 * view-mode toggle only. The AI plumbing lives inside `TripAiGuide` so
 * charts and narrative don't share a render path.
 */
export function InsightsSection({ trip, activities, targets, totalMinutes }: Props) {
  const theme = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const { barChartData, plannedLine, completedLine, categoryPieData } = useInsightsData(
    viewMode,
    activities,
  );
  const streak = useMemo(() => computeStreaks(activities), [activities]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      // Match the other section scrollables — a drag dismisses any open
      // keyboard without a press-wrapper intercepting empty-space touches.
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <StatsRow
        stats={[
          { label: 'Total', value: `${totalMinutes}m`, icon: 'time' },
          { label: 'Activities', value: String(activities.length), icon: 'list' },
          { label: 'Goals', value: String(targets.length), icon: 'flag' },
        ]}
      />
      <ViewModeToggle selected={viewMode} onSelect={setViewMode} />
      <BarChartCard title={`Totals (${viewMode})`} data={barChartData} valueSuffix="m" />
      <LineChartCard
        title="Planned vs Completed"
        data={plannedLine}
        data2={completedLine}
        color={Palette.skyBlue}
        color2={Palette.coral}
        label1="Planned"
        label2="Completed"
      />

      {/* Category split donut — scoped to this trip only, mirrors the
          Insights tab visual language so the trip-level view feels like
          the global screen zoomed into one journey. */}
      <PieChartCard title="Category Breakdown" data={categoryPieData} />

      {/* AI travel guide — sits between charts and streak so the reading
          order is "numbers → narrative → habit". */}
      <TripAiGuide trip={trip} activities={activities} />

      <Text style={[SharedStyles.sectionTitle, { color: theme.textPrimary }]}>Streak</Text>
      <StreakCard streak={streak} />
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  spacer: { height: Spacing.xxxl },
});
