import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTargets, useCategories, useActivities, useDeleteWithConfirm } from '@/hooks';
import { EntityActions } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ProgressBar, ConfirmDialog, Toast, NotFoundFallback } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { Colors, Spacing, BorderRadius, SharedStyles } from '@/constants';
import { computeProgress, computeTargetCurrentValue } from '@/utils/progressHelpers';

export default function TargetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTargetById, deleteTarget } = useTargets();
  const { findCategoryById } = useCategories();
  const { activities } = useActivities();

  const target = findTargetById(Number(id));

  const { loading, confirmVisible, showConfirm, cancelConfirm, handleDelete, toast, hideToast } =
    useDeleteWithConfirm(() => deleteTarget(Number(id)), 'Goal deleted');

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
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader title={category?.name ?? 'Goal'} subtitle={`${target.period} goal`} />

      <View style={SharedStyles.tagRow}>
        <InfoTag icon="flag-outline" label="Target" value={`${target.targetValue} min`} />
        <InfoTag icon="calendar-outline" label="Period" value={target.period} />
        <InfoTag
          icon={target.tripId ? 'airplane-outline' : 'earth-outline'}
          label="Scope"
          value={target.tripId ? 'This Trip' : 'All Trips'}
        />
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress</Text>
        <ProgressBar {...progress} current={currentValue} target={target.targetValue} />
        {progress.met && <Text style={styles.metText}>You've hit your goal exactly!</Text>}
      </View>

      <EntityActions
        onEdit={() => router.push({ pathname: '/target/[id]/edit', params: { id } })}
        onDelete={showConfirm}
        onBack={() => router.back()}
        loading={loading}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Goal"
        message="Are you sure you want to remove this goal? Your progress tracking will be lost."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={cancelConfirm}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressSection: { backgroundColor: Colors.cardBackground, borderColor: Colors.cardBorder, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.lg, padding: Spacing.lg },
  progressTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: Spacing.sm },
  metText: { color: Colors.successAction, fontSize: 14, fontWeight: '600', marginTop: Spacing.xs },
});
