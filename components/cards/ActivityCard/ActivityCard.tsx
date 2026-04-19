import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InfoTag } from '@/components/tags';
import { PrimaryButton } from '@/components/buttons';
import { Spacing, BorderRadius, Shadows, SharedStyles, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Activity, Category } from '@/types';

type Props = {
  activity: Activity;
  category?: Category;
  /**
   * Tapping the star fires this. Optional — when undefined the star is
   * hidden entirely so read-only surfaces (e.g. the past-trip recap) don't
   * render a non-interactive icon.
   */
  onToggleFavourite?: (activity: Activity) => void;
};

// Star-pip gold. Kept local since no other component renders a favourite
// marker yet — promote to `Palette` if/when a second surface needs it.
const STAR_GOLD = '#F5C518';

function ActivityCard({ activity, category, onToggleFavourite }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  const openDetails = useCallback(
    () => router.push({ pathname: '/activity/[id]', params: { id: activity.id.toString() } }),
    [router, activity.id],
  );

  const handleToggleFavourite = useCallback(() => {
    onToggleFavourite?.(activity);
  }, [onToggleFavourite, activity]);

  const showStar = onToggleFavourite !== undefined;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: activity.isFavourite ? STAR_GOLD : theme.cardBorder,
          borderWidth: activity.isFavourite ? 2 : 1,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={
        activity.isFavourite
          ? `Priority activity on ${activity.date}`
          : `Activity on ${activity.date}`
      }
    >
      {activity.isFavourite ? (
        <View style={[styles.priorityRibbon, { backgroundColor: STAR_GOLD }]}>
          <Ionicons name="star" size={12} color={Palette.white} />
          <Text style={styles.priorityRibbonText}>PRIORITY</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        {category && (
          <View style={[SharedStyles.colorDot, { backgroundColor: category.color }]} />
        )}
        <Text style={[styles.date, { color: theme.textPrimary }]}>{activity.date}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: activity.status === 'completed' ? theme.successAction : theme.accentAction }]}
          accessibilityLabel={`${activity.status === 'completed' ? 'Completed' : 'Planned'} activity`}
        >
          <Ionicons
            name={activity.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
            size={12}
            color={Palette.white}
          />
          <Text style={styles.statusText}>{activity.status === 'completed' ? 'Done' : 'Planned'}</Text>
        </View>
      </View>

      <View style={styles.tags}>
        <InfoTag icon="time-outline" label="Duration" value={`${activity.metric} min`} />
        {category && <InfoTag icon="pricetag-outline" label="Category" value={category.name} />}
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

      <View style={styles.footerRow}>
        <View style={styles.footerButton}>
          <PrimaryButton compact label="View Details" variant="accent" onPress={openDetails} />
        </View>
        {showStar ? (
          <Pressable
            onPress={handleToggleFavourite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              activity.isFavourite
                ? 'Unmark as priority activity'
                : 'Mark as priority activity'
            }
            accessibilityState={{ selected: activity.isFavourite }}
            style={({ pressed }) => [
              styles.starBtn,
              { borderColor: theme.cardBorder, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons
              name={activity.isFavourite ? 'star' : 'star-outline'}
              size={20}
              color={activity.isFavourite ? STAR_GOLD : theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    color: Palette.white,
    fontSize: 11,
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
  priorityRibbon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  priorityRibbonText: {
    color: Palette.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  starBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
