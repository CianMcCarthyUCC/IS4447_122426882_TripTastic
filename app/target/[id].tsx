import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTargets, useCategories, useActivities, useTrips, useDeleteWithConfirm } from '@/hooks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ProgressBar, NotFoundFallback } from '@/components/feedback';
import { EntityDetailScreen } from '@/components/layout';
import { Colors, Spacing, BorderRadius } from '@/constants';
import { computeProgress, computeTargetCurrentValue } from '@/utils/progressHelpers';
import { countryFlag } from '@/utils/countryFlag';

export default function TargetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { findTargetById, deleteTarget } = useTargets();
  const { findCategoryById } = useCategories();
  const { activities } = useActivities();
  const { findTripById } = useTrips();

  const target = findTargetById(Number(id));

  const deleteState = useDeleteWithConfirm(
    () => deleteTarget(Number(id)),
    'Goal deleted',
  );

  if (!target) {
    return <NotFoundFallback subtitle="This goal may have been deleted." onBack={() => router.back()} />;
  }

  const category = findCategoryById(target.categoryId);

  const currentValue = useMemo(
    () => computeTargetCurrentValue(target, activities),
    [activities, target],
  );

  const progress = useMemo(
    () => computeProgress(currentValue, target.targetValue, category?.color),
    [currentValue, target.targetValue, category?.color],
  );

  return (
    <EntityDetailScreen
      title="View Goal"
      onEdit={() => router.push({ pathname: '/target/[id]/edit', params: { id } })}
      deleteState={deleteState}
      deleteDialog={{
        title: 'Delete Goal',
        message: 'Are you sure you want to remove this goal? Your progress tracking will be lost.',
      }}
    >
      <View
        style={[
          styles.detailCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        ]}
      >
        <DetailRow label="Category" value={category?.name ?? 'Uncategorised'} theme={theme} />
        <DetailRow label="Target" value={`${target.targetValue} min`} theme={theme} />
        <DetailRow label="Period" value={target.period} theme={theme} />
        <DetailRow
          label="Scope"
          value={
            target.tripId
              ? `This Trip ${countryFlag(findTripById(target.tripId)?.country ?? '')}`.trim()
              : 'All Trips 🌍'
          }
          theme={theme}
          isLast
        />
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress</Text>
        <ProgressBar {...progress} current={currentValue} target={target.targetValue} />
        {progress.met && <Text style={styles.metText}>You've hit your goal exactly!</Text>}
      </View>

      {target.notes ? (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notesBody}>{target.notes}</Text>
        </View>
      ) : null}
    </EntityDetailScreen>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  isLast?: boolean;
};

function DetailRow({ label, value, theme, isLast }: DetailRowProps) {
  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomColor: theme.cardBorder, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    minWidth: 90,
    textTransform: 'uppercase',
  },
  rowValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressSection: { backgroundColor: Colors.cardBackground, borderColor: Colors.cardBorder, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.lg, padding: Spacing.lg },
  progressTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: Spacing.sm },
  metText: { color: Colors.successAction, fontSize: 14, fontWeight: '600', marginTop: Spacing.xs },
  notesSection: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  notesTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  notesBody: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
