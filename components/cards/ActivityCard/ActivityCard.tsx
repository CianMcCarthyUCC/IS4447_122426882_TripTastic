import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { Spacing, BorderRadius, Shadows, SharedStyles } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Activity, Category } from '@/types';

type Props = {
  activity: Activity;
  category?: Category;
};

function ActivityCard({ activity, category }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  const openDetails = useCallback(
    () => router.push({ pathname: '/activity/[id]', params: { id: activity.id.toString() } }),
    [router, activity.id],
  );

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={`Activity on ${activity.date}`}
    >
      <View style={styles.header}>
        {category && (
          <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
        )}
        <Text style={[styles.date, { color: theme.textPrimary }]}>{activity.date}</Text>
      </View>

      <View style={styles.tags}>
        <InfoTag label="Duration" value={`${activity.metric} min`} />
        {category && <InfoTag label="Category" value={category.name} />}
      </View>

      {activity.notes ? (
        <Text
          style={[styles.notes, { color: theme.textSecondary }]}
          numberOfLines={1}
          accessibilityLabel={`Notes: ${activity.notes}`}
        >
          {activity.notes}
        </Text>
      ) : null}

      <PrimaryButton compact label="View Details" variant="accent" onPress={openDetails} />
    </View>
  );
}

export default memo(ActivityCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  notes: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
