import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { Colors, Spacing, SharedStyles } from '@/constants';
import type { Activity, Category } from '@/types';

type Props = {
  activity: Activity;
  category?: Category;
};

function ActivityCard({ activity, category }: Props) {
  const router = useRouter();

  const openDetails = useCallback(
    () => router.push({ pathname: '/activity/[id]', params: { id: activity.id.toString() } }),
    [router, activity.id],
  );

  return (
    <View style={SharedStyles.card} accessibilityRole="summary" accessibilityLabel={`Activity on ${activity.date}`}>
      <Pressable onPress={openDetails} accessibilityRole="link" accessibilityHint="View activity details">
        <View style={styles.header}>
          {category && (
            <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
          )}
          <Text style={styles.date}>{activity.date}</Text>
        </View>
      </Pressable>

      <View style={styles.tags}>
        <InfoTag label="Duration" value={`${activity.metric} min`} />
        {category && <InfoTag label="Category" value={category.name} />}
      </View>

      {activity.notes ? (
        <Text style={styles.notes} numberOfLines={1} accessibilityLabel={`Notes: ${activity.notes}`}>
          {activity.notes}
        </Text>
      ) : null}

      <PrimaryButton compact label="View Details" onPress={openDetails} />
    </View>
  );
}

export default memo(ActivityCard);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  date: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  notes: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
