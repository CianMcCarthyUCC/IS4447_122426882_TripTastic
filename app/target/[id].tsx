import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTargets, useCategories, useActivities, useToast, useHaptics } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { ProgressBar, ConfirmDialog, Toast } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { Colors, Spacing, BorderRadius, SharedStyles } from '@/constants';
import { computeProgress } from '@/utils/progressHelpers';

/**
 * Target detail screen — full progress breakdown with ProgressBar.
 */
export default function TargetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTargetById, deleteTarget } = useTargets();
  const { findCategoryById } = useCategories();
  const { activities } = useActivities();
  const { toast, showToast, hideToast } = useToast();
  const haptics = useHaptics();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const target = findTargetById(Number(id));

  if (!target) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Not Found" subtitle="This target may have been deleted." />
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const category = findCategoryById(target.categoryId);

  const currentValue = useMemo(() => {
    return activities
      .filter((a) => {
        if (a.categoryId !== target.categoryId) return false;
        if (target.tripId !== null && a.tripId !== target.tripId) return false;
        return true;
      })
      .reduce((sum, a) => sum + a.metric, 0);
  }, [activities, target]);

  const progress = useMemo(
    () => computeProgress(currentValue, target.targetValue, category?.color),
    [currentValue, target.targetValue, category?.color],
  );

  const handleDelete = async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await deleteTarget(Number(id));
      haptics.success();
      showToast('Target deleted', 'success');
      router.back();
    } catch {
      showToast('Failed to delete. Please try again.', 'error');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScreenHeader
        title={category?.name ?? 'Target'}
        subtitle={`${target.period} goal`}
      />

      <View style={SharedStyles.tagRow}>
        <InfoTag label="Target" value={`${target.targetValue} min`} />
        <InfoTag label="Period" value={target.period} />
        <InfoTag label="Scope" value={target.tripId ? 'This Trip' : 'All Trips'} />
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress</Text>
        <ProgressBar {...progress} current={currentValue} target={target.targetValue} />
        {progress.met && (
          <Text style={styles.metText}>You've hit your target exactly!</Text>
        )}
      </View>

      <ButtonGroup>
        <PrimaryButton
          label="Edit"
          onPress={() => router.push({ pathname: '/target/[id]/edit', params: { id } })}
        />
        <PrimaryButton
          label="Delete"
          loading={loading}
          variant="danger"
          onPress={() => { haptics.warning(); setConfirmVisible(true); }}
        />
        <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
      </ButtonGroup>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Goal"
        message="Are you sure you want to remove this goal? Your progress tracking will be lost."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  progressTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  metText: {
    color: Colors.successAction,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
