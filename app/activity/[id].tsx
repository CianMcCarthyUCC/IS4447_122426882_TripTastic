import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useActivities, useCategories, useDeleteWithConfirm } from '@/hooks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { NotFoundFallback } from '@/components/feedback';
import { EntityDetailScreen } from '@/components/layout';
import { Spacing, BorderRadius } from '@/constants';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { findActivityById, deleteActivity } = useActivities();
  const { findCategoryById } = useCategories();

  const activity = findActivityById(Number(id));

  const deleteState = useDeleteWithConfirm(
    () => deleteActivity(Number(id)),
    'Activity deleted',
  );

  if (!activity) {
    return <NotFoundFallback subtitle="This activity may have been deleted." onBack={() => router.back()} />;
  }

  const category = findCategoryById(activity.categoryId);

  return (
    <EntityDetailScreen
      title="View Activity"
      onEdit={() => router.push({ pathname: '/activity/[id]/edit', params: { id } })}
      deleteState={deleteState}
      deleteDialog={{
        title: 'Delete Activity',
        message: "Are you sure you want to remove this activity from your trip? This can't be undone.",
      }}
    >
      <View
        style={[
          styles.detailCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        ]}
      >
        <DetailRow label="Date" value={activity.date} theme={theme} />
        <DetailRow label="Duration" value={`${activity.metric} min`} theme={theme} />
        <DetailRow label="Category" value={category?.name ?? 'Uncategorised'} theme={theme} />
        <DetailRow
          label="Status"
          value={activity.status === 'completed' ? 'Completed' : 'Planned'}
          theme={theme}
        />
        {activity.place ? <DetailRow label="Place" value={activity.place} theme={theme} /> : null}
        {activity.notes ? (
          <DetailRow label="Notes" value={activity.notes} theme={theme} isLast />
        ) : null}
      </View>
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
});
