import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '@/components/cards/CategoryIcon';
import { PressableOpacity, DetailsLink } from '@/components/buttons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  completeToggleLabel,
  deleteLabel,
  editLabel,
  favouriteToggleLabel,
  viewDetailsLabel,
} from '@/utils';
import type { Activity, Category } from '@/types';

type Props = {
  activity: Activity;
  category?: Category;
  /**
   * Tapping the star fires this. Optional - when undefined the star and
   * other inline actions are hidden so read-only surfaces (e.g. the
   * past-trip recap) render a clean read-only card.
   */
  onToggleFavourite?: (activity: Activity) => void;
  /** Flip the activity between planned and completed from the status chip. */
  onToggleComplete?: (activity: Activity) => void;
  /**
   * Inline trash action. When provided renders a small trash icon alongside
   * the other action icons. The parent owns the confirm dialog + toast.
   */
  onDelete?: (activity: Activity) => void;
};

/**
 * The Instagram-style post card for a single activity. Shows the date,
 * duration and place in the header, with a star to mark the activity
 * as a priority, a tappable status chip for one-tap complete / uncomplete,
 * and a link through to full details for notes and category.
 */
function ActivityCard({
  activity,
  category,
  onToggleFavourite,
  onToggleComplete,
  onDelete,
}: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  const openDetails = useCallback(
    () => router.push({ pathname: '/activity/[id]', params: { id: activity.id.toString() } }),
    [router, activity.id],
  );

  const openEdit = useCallback(
    () =>
      router.push({
        pathname: '/activity/[id]/edit',
        params: { id: activity.id.toString() },
      }),
    [router, activity.id],
  );

  const handleToggleFavourite = useCallback(() => {
    onToggleFavourite?.(activity);
  }, [onToggleFavourite, activity]);

  const handleToggleComplete = useCallback(() => {
    onToggleComplete?.(activity);
  }, [onToggleComplete, activity]);

  const handleDelete = useCallback(() => {
    onDelete?.(activity);
  }, [onDelete, activity]);

  const showStar = onToggleFavourite !== undefined;
  const showEdit = showStar;
  const showDelete = onDelete !== undefined;
  const canToggleStatus = onToggleComplete !== undefined;
  const isCompleted = activity.status === 'completed';

  return (
    <View
      style={[styles.post, { borderBottomColor: theme.cardBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={
        activity.isFavourite
          ? `Priority activity on ${activity.date}`
          : `Activity on ${activity.date}`
      }
    >
      {/* Post header - category glyph as avatar, date + duration as the
          primary line (separated by a thin divider), place underneath.
          Priority pill + tappable status chip sit on the right. */}
      <View style={styles.header}>
        {category ? (
          <View style={styles.categoryIcon}>
            <CategoryIcon category={category} size={18} />
          </View>
        ) : null}
        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.date, { color: theme.textPrimary }]}>{activity.date}</Text>
            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
            <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.duration, { color: theme.textSecondary }]}>
              {activity.metric} min
            </Text>
          </View>
          {activity.place ? (
            <View style={styles.placeRow}>
              <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
              <Text
                style={[styles.placeText, { color: theme.textSecondary }]}
                numberOfLines={1}
                accessibilityLabel={`At ${activity.place}`}
              >
                {activity.place}
              </Text>
            </View>
          ) : null}
        </View>
        {canToggleStatus ? (
          <PressableOpacity
            onPress={handleToggleComplete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={completeToggleLabel(isCompleted)}
            accessibilityState={{ selected: isCompleted }}
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted ? theme.successAction : Palette.grey500,
              },
            ]}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={11}
              color={Palette.white}
            />
            <Text style={styles.statusText}>{isCompleted ? 'Completed' : 'Planned'}</Text>
          </PressableOpacity>
        ) : (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted ? theme.successAction : Palette.grey500,
              },
            ]}
            accessibilityLabel={`${isCompleted ? 'Completed' : 'Planned'} activity`}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={11}
              color={Palette.white}
            />
            <Text style={styles.statusText}>{isCompleted ? 'Completed' : 'Planned'}</Text>
          </View>
        )}
      </View>

      {/* Instagram-style action row - star + edit on the left, View
          Details text link on the right. Notes and category details live
          on the View Details screen to keep the card compact. */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {showStar ? (
            <PressableOpacity
              onPress={handleToggleFavourite}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={favouriteToggleLabel('activity', activity.isFavourite)}
              accessibilityState={{ selected: activity.isFavourite }}
              style={styles.actionIcon}
            >
              <Ionicons
                name={activity.isFavourite ? 'star' : 'star-outline'}
                size={22}
                color={activity.isFavourite ? Palette.starGold : theme.textPrimary}
              />
            </PressableOpacity>
          ) : null}
          {showEdit ? (
            <PressableOpacity
              onPress={openEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={editLabel('activity')}
              style={styles.actionIcon}
            >
              <Ionicons name="create-outline" size={20} color={theme.textPrimary} />
            </PressableOpacity>
          ) : null}
          {showDelete ? (
            <PressableOpacity
              onPress={handleDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={deleteLabel('activity')}
              style={styles.actionIcon}
            >
              <Ionicons name="trash-outline" size={20} color={theme.dangerAction} />
            </PressableOpacity>
          ) : null}
        </View>
        <DetailsLink onPress={openDetails} accessibilityLabel={viewDetailsLabel('activity')} />
      </View>
    </View>
  );
}

export default memo(ActivityCard);

const styles = StyleSheet.create({
  post: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryIcon: {},
  headerTextCol: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 12,
    width: 1,
  },
  duration: {
    fontSize: 13,
    fontWeight: '600',
  },
  placeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  placeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
