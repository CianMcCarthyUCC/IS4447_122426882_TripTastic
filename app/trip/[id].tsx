import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTrips, useActivities, useTargets, useCategories, useAppTheme, useDeleteWithConfirm } from '@/hooks';
import { PrimaryButton, ButtonGroup } from '@/components/buttons';
import { InfoTag } from '@/components/tags';
import { StatsRow } from '@/components/cards';
import { ConfirmDialog, Toast, ProgressBar } from '@/components/feedback';
import { ScreenHeader, ScreenContainer } from '@/components/layout';
import { Spacing, BorderRadius, Shadows, SharedStyles } from '@/constants';
import { computeProgress } from '@/utils/progressHelpers';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findTripById, deleteTrip } = useTrips();
  const { activities } = useActivities();
  const { targets } = useTargets();
  const { categories } = useCategories();
  const theme = useAppTheme();

  const trip = findTripById(Number(id));

  const { loading, confirmVisible, showConfirm, cancelConfirm, handleDelete, toast, hideToast } =
    useDeleteWithConfirm(() => deleteTrip(Number(id)), 'Trip deleted');

  if (!trip) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Not Found" subtitle="This trip may have been deleted." />
        <PrimaryButton label="Go Back" variant="secondary" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const tripActivities = useMemo(() => activities.filter((a) => a.tripId === trip.id), [activities, trip.id]);
  const tripTargets = useMemo(() => targets.filter((t) => t.tripId === trip.id), [targets, trip.id]);
  const completed = useMemo(() => tripActivities.filter((a) => a.status === 'completed'), [tripActivities]);
  const planned = useMemo(() => tripActivities.filter((a) => a.status === 'planned'), [tripActivities]);
  const totalMinutes = useMemo(() => tripActivities.reduce((s, a) => s + a.metric, 0), [tripActivities]);

  const startDate = new Date(trip.startDate + 'T00:00:00');
  const endDate = new Date(trip.endDate + 'T00:00:00');
  const tripDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

  return (
    <ScreenContainer>
      <Toast {...toast} onHide={hideToast} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {trip.coverImage ? (
          <Image source={{ uri: trip.coverImage }} style={styles.cover} />
        ) : null}

        <ScreenHeader title={trip.name} subtitle={`${trip.destination}, ${trip.country}`} />

        <View style={SharedStyles.tagRow}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
          <InfoTag label="Days" value={String(tripDays)} />
        </View>

        <StatsRow stats={[
          { label: 'Activities', value: String(tripActivities.length), icon: 'list' },
          { label: 'Completed', value: String(completed.length), icon: 'checkmark-circle' },
          { label: 'Total', value: `${Math.round(totalMinutes / 60)}h`, icon: 'time' },
        ]} />

        {/* Progress: completed vs planned */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Trip Progress</Text>
          <ProgressBar
            {...computeProgress(completed.length, tripActivities.length)}
            current={completed.length}
            target={tripActivities.length}
            unit="activities"
          />
        </View>

        {/* Goals for this trip */}
        {tripTargets.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Trip Goals</Text>
            {tripTargets.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const current = tripActivities.filter((a) => a.categoryId === t.categoryId).reduce((s, a) => s + a.metric, 0);
              return (
                <View key={t.id} style={styles.goalRow}>
                  <Text style={[styles.goalName, { color: theme.textPrimary }]}>{cat?.name ?? 'Unknown'}</Text>
                  <Text style={[styles.goalProgress, { color: theme.textSecondary }]}>{current} / {t.targetValue} min</Text>
                </View>
              );
            })}
          </View>
        )}

        <ButtonGroup>
          <PrimaryButton label="Delete Trip" loading={loading} variant="danger" onPress={showConfirm} />
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </ButtonGroup>

        <View style={styles.spacer} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Trip"
        message="This will delete the trip and all its activities and goals. This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={cancelConfirm}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: BorderRadius.md, height: 160, marginBottom: Spacing.lg, width: '100%', ...Shadows.md },
  section: { borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.lg, padding: Spacing.lg, ...Shadows.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  goalName: { fontSize: 15, fontWeight: '600' },
  goalProgress: { fontSize: 14 },
  spacer: { height: Spacing.xxl },
});
