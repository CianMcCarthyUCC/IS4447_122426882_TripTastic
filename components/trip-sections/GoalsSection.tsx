import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCategories, useHaptics, useSuggestionDismissal, useTargets, useToast } from '@/hooks';
import { TargetList } from '@/components/lists';
import { SummaryBanner } from '@/components/cards';
import { PressableOpacity } from '@/components/buttons';
import { ConfirmDialog, CreateEmptyCard, EmptyState, Toast } from '@/components/feedback';
import {
  FiltersPill,
  QuickFilterChip,
  SearchableListPicker,
  SegmentedPills,
  SuggestionChip,
} from '@/components/forms';
import type { SearchableOption, SegmentOption } from '@/components/forms';
import { DrillDownFilterSheet } from '@/components/modals';
import type { DrillDownFilterConfig } from '@/components/modals';
import { computeTargetCurrentValue, suggestTargetFilter } from '@/utils';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Activity, Target } from '@/types';

type Props = {
  activities: Activity[];
  targets: Target[];
};

const SUGGESTION_KEY = 'suggestion:goals';

type GoalsStatus = 'all' | 'in-progress' | 'completed';

const STATUS_OPTIONS: ReadonlyArray<SegmentOption<GoalsStatus>> = [
  { label: 'Any', value: 'all' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

// Slider snaps to 5% ticks - finer than the old preset pills but still
// tidy values so the filter label reads cleanly (e.g. "45% or more").
const PERCENT_STEP = 5;

/**
 * The Goals tab on the trip detail screen. Shows a progress banner across
 * the top and a list of the user's goals with how close they are to
 * hitting each one. Filters mirror the Activities tab: a favourites
 * quick-toggle, a status toggle (all vs in-progress), and a drill-down
 * sheet for category selection.
 */
export function GoalsSection({ activities, targets }: Props) {
  const router = useRouter();
  const theme = useAppTheme();
  const haptics = useHaptics();
  const { categories } = useCategories();
  const { toggleFavourite, deleteTarget } = useTargets();
  const { toast, showToast, hideToast } = useToast();
  const { isDismissed, dismiss } = useSuggestionDismissal();
  const [status, setStatus] = useState<GoalsStatus>('all');
  const [minPercent, setMinPercent] = useState<number>(0);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Target | null>(null);

  const handleRequestDelete = useCallback((target: Target) => {
    setPendingDelete(target);
  }, []);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteTarget(target.id);
      haptics.success();
      showToast('Goal deleted', 'accent');
    } catch {
      haptics.error();
      showToast('Failed to delete goal', 'error');
    }
  }, [pendingDelete, deleteTarget, haptics, showToast]);

  // "On track" = current metric total >= target value for this category.
  const onTrack = useMemo(() => {
    return targets.filter((t) => computeTargetCurrentValue(t, activities) >= t.targetValue).length;
  }, [targets, activities]);

  const suggestion = useMemo(
    () => suggestTargetFilter(targets, activities),
    [targets, activities],
  );
  // Chip only appears when there's something actionable AND the user hasn't
  // already dismissed it this session AND no filter is currently applied -
  // keeps the nudge quiet once the user has engaged with it.
  const showSuggestion =
    suggestion !== null &&
    !isDismissed(SUGGESTION_KEY) &&
    status === 'all' &&
    minPercent === 0 &&
    !favouritesOnly &&
    selectedCategory === 'all';

  const handleApplySuggestion = useCallback(() => {
    if (suggestion?.apply.status === 'in-progress') setStatus('in-progress');
  }, [suggestion]);

  const visibleTargets = useMemo(() => {
    let result = targets;
    if (status === 'in-progress') {
      result = result.filter((t) => computeTargetCurrentValue(t, activities) < t.targetValue);
    } else if (status === 'completed') {
      result = result.filter((t) => computeTargetCurrentValue(t, activities) >= t.targetValue);
    }
    if (minPercent > 0) {
      result = result.filter((t) => {
        if (t.targetValue <= 0) return false;
        const pct = (computeTargetCurrentValue(t, activities) / t.targetValue) * 100;
        return pct >= minPercent;
      });
    }
    if (favouritesOnly) {
      result = result.filter((t) => t.isFavourite);
    }
    if (selectedCategory !== 'all') {
      result = result.filter((t) => String(t.categoryId) === selectedCategory);
    }
    // Favourites pinned to the top of the list.
    return [...result].sort((a, b) => {
      if (a.isFavourite === b.isFavourite) return 0;
      return a.isFavourite ? -1 : 1;
    });
  }, [status, minPercent, targets, activities, favouritesOnly, selectedCategory]);

  const isFiltered =
    status !== 'all' || minPercent > 0 || favouritesOnly || selectedCategory !== 'all';
  const appliedFilterCount =
    (status !== 'all' ? 1 : 0) +
    (minPercent > 0 ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0);

  const categoryOptions = useMemo<SearchableOption[]>(
    () => [
      { label: 'All categories', value: 'all', icon: 'apps-outline' },
      ...categories.map((c) => ({
        label: c.name,
        value: String(c.id),
        color: c.color,
        icon: c.icon as SearchableOption['icon'],
      })),
    ],
    [categories],
  );

  const categoryLabelFor = (v: string) =>
    v === 'all'
      ? 'All categories'
      : categories.find((c) => String(c.id) === v)?.name ?? 'All categories';

  const statusLabel = (v: GoalsStatus) =>
    v === 'in-progress' ? 'In progress' : v === 'completed' ? 'Completed' : 'Any status';

  const sheetFilters = useMemo<DrillDownFilterConfig[]>(
    () => [
      {
        key: 'status',
        icon: 'flag-outline',
        label: 'Status',
        subViewTitle: 'Status',
        value: status,
        defaultValue: 'all',
        describe: (v) => statusLabel(v as GoalsStatus),
        isActive: (v) => (v as GoalsStatus) !== 'all',
        onApply: (v) => setStatus(v as GoalsStatus),
        renderPicker: ({ value, setValue, close }) => (
          <View style={styles.pickerPad}>
            <SegmentedPills<GoalsStatus>
              options={STATUS_OPTIONS}
              selected={value as GoalsStatus}
              onSelect={(v) => {
                setValue(v);
                close();
              }}
              accessibilityLabel="Filter goals by status"
            />
          </View>
        ),
      },
      {
        key: 'minPercent',
        icon: 'trending-up-outline',
        label: 'Min % complete',
        subViewTitle: 'Min % complete',
        value: minPercent,
        defaultValue: 0,
        describe: (v) => ((v as number) === 0 ? 'Any' : `${v as number}% or more`),
        isActive: (v) => (v as number) > 0,
        onApply: (v) => setMinPercent(v as number),
        renderPicker: ({ value, setValue }) => (
          <View style={styles.pickerPad}>
            <Text style={[styles.pickerHint, { color: theme.textSecondary }]}>
              Show goals at least this far along.
            </Text>
            <PercentSlider
              value={(value as number) ?? 0}
              onChange={(v) => setValue(v)}
            />
          </View>
        ),
      },
      {
        key: 'category',
        icon: 'pricetag-outline',
        label: 'Category',
        subViewTitle: 'Category',
        value: selectedCategory,
        defaultValue: 'all',
        describe: (v) => categoryLabelFor(v as string),
        isActive: (v) => (v as string) !== 'all',
        onApply: (v) => setSelectedCategory(v as string),
        renderPicker: ({ value, setValue, close }) => (
          <SearchableListPicker
            options={categoryOptions}
            selected={value as string}
            onSelect={(v) => {
              setValue(v);
              close();
            }}
            searchPlaceholder="Search categories"
            accessibilityLabel="Filter goals by category"
          />
        ),
      },
    ],
    [
      categoryOptions,
      selectedCategory,
      categories,
      setSelectedCategory,
      status,
      minPercent,
      theme.textSecondary,
    ],
  );

  const resetFilters = useCallback(() => {
    setStatus('all');
    setMinPercent(0);
    setFavouritesOnly(false);
    setSelectedCategory('all');
  }, []);

  // SummaryBanner + filter row go into the list header so the whole goals
  // section scrolls as one (a drag anywhere lands on the same scrollable
  // surface). Memoised so unrelated state changes don't re-render it.
  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Goals</Text>
          <PressableOpacity
            onPress={() => { haptics.light(); router.push('/target/add'); }}
            style={[styles.addBtn, { backgroundColor: theme.accentAction }]}
            accessibilityRole="button"
            accessibilityLabel="Add goal"
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={Palette.white} />
            <Text style={[styles.addBtnText, { color: Palette.white }]}>Add Goal</Text>
          </PressableOpacity>
        </View>
        <SummaryBanner onTrack={onTrack} total={targets.length} />
        {showSuggestion && suggestion ? (
          <SuggestionChip
            label={suggestion.label}
            onApply={handleApplySuggestion}
            onDismiss={() => dismiss(SUGGESTION_KEY)}
          />
        ) : null}
        <View style={styles.quickRow}>
          <QuickFilterChip
            label="Favourites"
            icon={favouritesOnly ? 'star' : 'star-outline'}
            active={favouritesOnly}
            onPress={() => setFavouritesOnly((v) => !v)}
            accessibilityLabel={favouritesOnly ? 'Show all goals' : 'Show favourite goals only'}
          />
          <FiltersPill activeCount={appliedFilterCount} onPress={() => setSheetOpen(true)} />
          {isFiltered ? (
            <QuickFilterChip
              label="Clear"
              icon="close-circle-outline"
              active
              onPress={resetFilters}
              accessibilityLabel="Clear all filters"
            />
          ) : null}
        </View>
      </View>
    ),
    [
      onTrack,
      targets.length,
      showSuggestion,
      suggestion,
      handleApplySuggestion,
      dismiss,
      favouritesOnly,
      appliedFilterCount,
      isFiltered,
      resetFilters,
      haptics,
      router,
      theme.accentAction,
      theme.textPrimary,
    ],
  );

  // Two distinct "empty" states: zero goals defined vs filter mask.
  const listEmpty =
    targets.length === 0 ? (
      <CreateEmptyCard
        onPress={() => router.push('/target/add')}
        icon="add"
        backgroundIcon="trophy"
        title="No goals yet"
        helper="Tap to set your first target and track your trip progress."
        accessibilityLabel="Add your first goal"
      />
    ) : (
      <EmptyState
        title="Nothing matches"
        message="Try clearing the filter or pick a different category."
        actionLabel="Clear filters"
        onAction={resetFilters}
      />
    );

  return (
    <>
      <Toast {...toast} position="bottom" onHide={hideToast} />
      <TargetList
        targets={visibleTargets}
        categories={categories}
        activities={activities}
        onToggleFavourite={toggleFavourite}
        onDelete={handleRequestDelete}
        listHeaderComponent={listHeader}
        listEmptyComponent={listEmpty}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete goal?"
        message="This removes the goal and any progress it was tracking. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <DrillDownFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={sheetFilters}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pickerPad: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  pickerHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  sliderBlock: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sliderValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  sliderRangeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderTouch: {
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  sliderTrack: {
    borderRadius: BorderRadius.pill,
    height: 6,
    width: '100%',
  },
  sliderFill: {
    borderRadius: BorderRadius.pill,
    height: '100%',
  },
  sliderThumb: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 22,
    justifyContent: 'center',
    marginLeft: -11,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -11 }],
    width: 22,
    ...Shadows.sm,
  },
  sliderScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sliderScaleLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

/**
 * A compact horizontal slider that snaps to PERCENT_STEP ticks. Built on
 * PanResponder so we don't pull in another native dep for the single
 * place in the app that needs continuous range selection.
 */
function PercentSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const theme = useAppTheme();
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  // Absolute page-x of the track's left edge + its width, cached in refs
  // so the PanResponder (created once, captures on first render) can
  // read them during a drag. Using pageX lets us map `gestureState.moveX`
  // straight to a position on the track; using locationX instead made
  // the thumb jump because locationX is relative to the touch target,
  // which changes whenever a finger slides over a child view.
  const trackPageXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      trackPageXRef.current = x;
      trackWidthRef.current = w;
      setTrackWidth(w);
    });
  }, []);

  const onLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      measureTrack();
    },
    [measureTrack],
  );

  const snap = useCallback((raw: number) => {
    const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, raw));
    return Math.round(clamped / PERCENT_STEP) * PERCENT_STEP;
  }, []);

  const updateFromPageX = useCallback(
    (pageX: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) return;
      const localX = pageX - trackPageXRef.current;
      const pct = (localX / width) * (SLIDER_MAX - SLIDER_MIN) + SLIDER_MIN;
      const snapped = snap(pct);
      if (snapped !== valueRef.current) onChange(snapped);
    },
    [onChange, snap],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the responder even if the caller is scrollable - users slide
      // with their finger well past the thumb, and without this the parent
      // ScrollView can steal the gesture mid-drag.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        // Re-measure on grant in case the sheet animated into place
        // between layout and the first touch.
        measureTrack();
        updateFromPageX(e.nativeEvent.pageX);
      },
      onPanResponderMove: (_e, g) => updateFromPageX(g.moveX),
    }),
  ).current;

  const fillWidth = trackWidth > 0 ? (value / SLIDER_MAX) * trackWidth : 0;

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderValueRow}>
        <Text style={[styles.sliderValue, { color: theme.textPrimary }]}>
          {value === 0 ? 'Any progress' : `${value}% or more`}
        </Text>
        <Text style={[styles.sliderRangeLabel, { color: theme.textSecondary }]}>
          {value}%
        </Text>
      </View>

      <View
        {...panResponder.panHandlers}
        style={styles.sliderTouch}
        accessibilityRole="adjustable"
        accessibilityLabel="Minimum goal progress"
        accessibilityValue={{ min: SLIDER_MIN, max: SLIDER_MAX, now: value }}
      >
        <View
          ref={trackRef}
          onLayout={onLayout}
          style={[styles.sliderTrack, { backgroundColor: theme.tagBackground }]}
        >
          <View
            style={[
              styles.sliderFill,
              { backgroundColor: Palette.coral, width: fillWidth },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              { backgroundColor: Palette.coral, left: fillWidth },
            ]}
          />
        </View>
      </View>

      <View style={styles.sliderScaleRow}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <Text
            key={tick}
            style={[styles.sliderScaleLabel, { color: theme.textSecondary }]}
          >
            {tick}%
          </Text>
        ))}
      </View>
    </View>
  );
}
