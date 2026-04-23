import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InfoTag } from '@/components/tags';
import { DetailsLink, PressableOpacity } from '@/components/buttons';
import { CategoryIcon } from '@/components/cards/CategoryIcon';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { computeProgress } from '@/utils/progressHelpers';
import { deleteLabel, editLabel, favouriteToggleLabel, viewDetailsLabel } from '@/utils';
import type { Target, Category } from '@/types';

type Props = {
  target: Target;
  category?: Category;
  currentValue: number;
  /**
   * Handlers for inline actions on the card. Both are optional so the
   * card also works on read-only surfaces.
   */
  onToggleFavourite?: (target: Target) => void;
  /** Inline trash action. The parent owns the confirm + toast. */
  onDelete?: (target: Target) => void;
};

/**
 * Card for a single user goal. Shows the category (via its coloured
 * icon bubble), the target, the scope (trip-specific or all trips) and
 * how close the user is to hitting it. Inline actions let the user
 * favourite or edit the goal; "View Details" opens the full screen.
 */
function TargetCard({ target, category, currentValue, onToggleFavourite, onDelete }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  const openDetails = useCallback(
    () => router.push({ pathname: '/target/[id]', params: { id: target.id.toString() } }),
    [router, target.id],
  );

  const openEdit = useCallback(
    () => router.push({ pathname: '/target/[id]/edit', params: { id: target.id.toString() } }),
    [router, target.id],
  );

  const handleToggleFavourite = useCallback(() => {
    onToggleFavourite?.(target);
  }, [onToggleFavourite, target]);

  const handleDelete = useCallback(() => {
    onDelete?.(target);
  }, [onDelete, target]);

  const showActions = onToggleFavourite !== undefined;
  const showDelete = onDelete !== undefined;

  const progress = useMemo(
    () => computeProgress(currentValue, target.targetValue, category?.color),
    [currentValue, target.targetValue, category?.color],
  );

  return (
    <View
      style={[styles.post, { borderBottomColor: theme.cardBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={`Target: ${category?.name ?? 'Unknown'} - ${progress.percent}% complete`}
    >
      <View style={styles.header}>
        {category ? (
          <View style={styles.iconWrap}>
            <CategoryIcon category={category} size={18} variant="bubble" />
          </View>
        ) : null}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {category?.name ?? 'Unknown'}
        </Text>
        {target.isFavourite ? (
          <View style={[styles.priorityPill, { backgroundColor: Palette.starGold }]}>
            <Ionicons name="star" size={10} color={Palette.white} />
            <Text style={styles.priorityPillText}>PRIORITY</Text>
          </View>
        ) : null}
        {/* Top-right status pill: green when the goal is met or exceeded,
            muted when it's still in progress. Replaces the previous dual
            "EXCEEDED" text + Exceeded pill inside ProgressBar so there's
            one canonical status indicator per card. */}
        <StatusPill
          exceeded={progress.exceeded}
          met={progress.met}
          theme={theme}
        />
      </View>

      <ProgressBar {...progress} current={currentValue} target={target.targetValue} />

      <View style={styles.tags}>
        <InfoTag icon="calendar-outline" label="Period" value={target.period} />
        <InfoTag
          icon={target.tripId ? 'airplane-outline' : 'earth-outline'}
          label="Scope"
          value={target.tripId ? 'This Trip' : 'All Trips'}
        />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {showActions ? (
            <PressableOpacity
              onPress={handleToggleFavourite}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={favouriteToggleLabel('goal', target.isFavourite)}
              accessibilityState={{ selected: target.isFavourite }}
              style={styles.actionIcon}
            >
              <Ionicons
                name={target.isFavourite ? 'star' : 'star-outline'}
                size={22}
                color={target.isFavourite ? Palette.starGold : theme.textPrimary}
              />
            </PressableOpacity>
          ) : null}
          {showActions ? (
            <PressableOpacity
              onPress={openEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={editLabel('goal')}
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
              accessibilityLabel={deleteLabel('goal')}
              style={styles.actionIcon}
            >
              <Ionicons name="trash-outline" size={20} color={theme.dangerAction} />
            </PressableOpacity>
          ) : null}
        </View>
        <DetailsLink onPress={openDetails} accessibilityLabel={viewDetailsLabel('goal')} />
      </View>
    </View>
  );
}

export default memo(TargetCard);

type StatusPillProps = {
  exceeded: boolean;
  met: boolean;
  theme: ReturnType<typeof useAppTheme>;
};

function StatusPill({ exceeded, met, theme }: StatusPillProps) {
  const complete = exceeded || met;
  const label = exceeded ? 'Exceeded' : met ? 'Completed' : 'In progress';
  const background = complete ? theme.successAction : theme.tagBackground;
  const color = complete ? Palette.white : theme.textSecondary;
  return (
    <View style={[styles.statusPill, { backgroundColor: background }]}>
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
}

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
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    // No extra chrome - CategoryIcon's bubble already carries colour.
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  priorityPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  priorityPillText: {
    color: Palette.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
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
