import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FilterChips, SegmentedPills } from '@/components/forms';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { ChipOption } from '@/components/forms/FilterChips/FilterChips';
import type {
  InsightsContinent,
  InsightsCountry,
  InsightsDateRange,
  InsightsStatus,
  InsightsTripId,
} from '@/hooks';
import type { Continent } from '@/utils/continent';
import type { Trip } from '@/types';

// ----- Shared options -----
// Status filter values (includes 'all'). Distinct from ActivityForm's
// status picker because that one has no 'all' bucket.
const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'Completed', value: 'completed' },
] as const;

const DATE_RANGE_OPTIONS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
] as const;

function isoFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Drill-down views inside the filter sheet. 'root' is the summary list;
// each other value is a detail screen with its own pill/chip picker.
// iOS Settings pattern — scales cleanly as filters grow.
type FilterView = 'root' | 'trip' | 'status' | 'date' | 'continent' | 'country';

const SUB_VIEW_TITLES: Record<Exclude<FilterView, 'root'>, string> = {
  trip: 'Trip',
  status: 'Status',
  date: 'Date range',
  continent: 'Continent',
  country: 'Country',
};

// ----- FilterRow -----
type FilterRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  disabledHint?: string;
};

/**
 * Row in the drill-down filter list. Left icon + label stacked with the
 * current selection underneath, right-side chevron. Coral-tinted value
 * when the filter is non-default so the root list doubles as a summary
 * of what's currently applied.
 */
function FilterRow({
  icon,
  label,
  value,
  active,
  onPress,
  disabled,
  disabledHint,
}: FilterRowProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${label}, ${disabled ? disabledHint ?? 'unavailable' : value}`}
      style={({ pressed }) => [
        styles.filterRow,
        { borderColor: theme.cardBorder },
        pressed && !disabled && styles.filterRowPressed,
        disabled && styles.filterRowDisabled,
      ]}
    >
      <View style={[styles.filterRowIcon, { backgroundColor: theme.tagBackground }]}>
        <Ionicons name={icon} size={18} color={theme.textPrimary} />
      </View>
      <View style={styles.filterRowBody}>
        <Text style={[styles.filterRowLabel, { color: theme.textPrimary }]}>{label}</Text>
        <Text
          style={[
            styles.filterRowValue,
            { color: active ? Palette.coral : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {disabled ? disabledHint ?? value : value}
        </Text>
      </View>
      {!disabled ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

// ----- DateRangeSubView -----
type DateRangeSubViewProps = {
  dateRange: InsightsDateRange;
  customStartDate: string | null;
  customEndDate: string | null;
  onSelect: (v: InsightsDateRange) => void;
  onApplyCustom: (start: string | null, end: string | null) => void;
};

/**
 * Date-range sub-screen. Presets live in a SegmentedPills row; tapping
 * "Custom" reveals two native date pickers + an Apply button so the user
 * can finish selecting both bounds before the sheet navigates back.
 */
function DateRangeSubView({
  dateRange,
  customStartDate,
  customEndDate,
  onSelect,
  onApplyCustom,
}: DateRangeSubViewProps) {
  const theme = useAppTheme();
  // Draft state so the parent filter doesn't re-apply on every picker tap.
  // Seeded from committed values when the sub-view mounts.
  const [draftStart, setDraftStart] = useState<string | null>(customStartDate);
  const [draftEnd, setDraftEnd] = useState<string | null>(customEndDate);

  const startAsDate = draftStart ? new Date(`${draftStart}T00:00:00`) : new Date();
  const endAsDate = draftEnd ? new Date(`${draftEnd}T00:00:00`) : new Date();

  const isCustom = dateRange === 'custom';

  return (
    <View>
      <SegmentedPills
        options={DATE_RANGE_OPTIONS}
        selected={dateRange}
        onSelect={onSelect}
        accessibilityLabel="Filter by date range"
      />

      {isCustom ? (
        <View style={styles.customDateWrap}>
          <Text style={[styles.customDateLabel, { color: theme.textSecondary }]}>
            START DATE
          </Text>
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            value={startAsDate}
            maximumDate={draftEnd ? new Date(`${draftEnd}T00:00:00`) : undefined}
            onChange={(_e, d) => {
              if (d) setDraftStart(isoFromDate(d));
            }}
            accessibilityLabel="Custom start date"
          />

          <Text style={[styles.customDateLabel, { color: theme.textSecondary }]}>
            END DATE
          </Text>
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            value={endAsDate}
            minimumDate={draftStart ? new Date(`${draftStart}T00:00:00`) : undefined}
            onChange={(_e, d) => {
              if (d) setDraftEnd(isoFromDate(d));
            }}
            accessibilityLabel="Custom end date"
          />

          <Pressable
            onPress={() => onApplyCustom(draftStart, draftEnd)}
            disabled={!draftStart && !draftEnd}
            accessibilityRole="button"
            accessibilityLabel="Apply custom date range"
            style={({ pressed }) => [
              styles.customDateApply,
              { backgroundColor: Palette.coral },
              (!draftStart && !draftEnd) && styles.customDateApplyDisabled,
              pressed && styles.filterRowPressed,
            ]}
          >
            <Text style={styles.customDateApplyText}>Apply range</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ----- InsightsFilterSheet -----
export type InsightsFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  status: InsightsStatus;
  onStatusChange: (v: InsightsStatus) => void;
  dateRange: InsightsDateRange;
  onDateRangeChange: (v: InsightsDateRange) => void;
  customStartDate: string | null;
  customEndDate: string | null;
  onCustomDateRangeChange: (start: string | null, end: string | null) => void;
  tripId: InsightsTripId;
  onTripIdChange: (v: InsightsTripId) => void;
  continent: InsightsContinent;
  onContinentChange: (v: InsightsContinent) => void;
  country: InsightsCountry;
  onCountryChange: (v: InsightsCountry) => void;
  trips: Trip[];
  availableContinents: Continent[];
  availableCountries: string[];
  activeFilterCount: number;
  onClearAll: () => void;
  onShowToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
};

/**
 * Bottom-sheet Modal containing the secondary-filter UI for the Insights
 * screen. Drill-down (iOS Settings style): root list of filter rows →
 * sub-screen for each filter. Selecting an option shows a toast and pops
 * back to the root; "Custom" date range is the only sub-screen that stays
 * open until the user presses Apply.
 */
export function InsightsFilterSheet({
  visible,
  onClose,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateRangeChange,
  tripId,
  onTripIdChange,
  continent,
  onContinentChange,
  country,
  onCountryChange,
  trips,
  availableContinents,
  availableCountries,
  activeFilterCount,
  onClearAll,
  onShowToast,
}: InsightsFilterSheetProps) {
  const theme = useAppTheme();
  const [view, setView] = useState<FilterView>('root');

  // Reset the drill-down view whenever the sheet re-opens so the user
  // never lands back inside a sub-screen they left open last time.
  const resetView = useCallback(() => setView('root'), []);

  const handleClose = () => {
    resetView();
    onClose();
  };

  const handleClearAll = () => {
    onClearAll();
    resetView();
  };

  // Human-readable summary of the current selection, shown on each root-list row.
  const tripLabel =
    tripId === 'all' ? 'All trips' : trips.find((t) => t.id === tripId)?.name ?? 'All trips';
  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? 'All';
  const dateLabel =
    dateRange === 'custom'
      ? customStartDate && customEndDate
        ? `${formatIsoDate(customStartDate)} – ${formatIsoDate(customEndDate)}`
        : customStartDate
          ? `From ${formatIsoDate(customStartDate)}`
          : customEndDate
            ? `Until ${formatIsoDate(customEndDate)}`
            : 'Custom'
      : DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? 'All time';
  const continentLabel = continent === 'all' ? 'All continents' : continent;
  const countryLabel = country === 'all' ? 'All countries' : country;

  const tripChips: ChipOption[] = useMemo(
    () => [
      { label: 'All trips', value: 'all' },
      ...trips.map((t) => ({ label: t.name, value: String(t.id) })),
    ],
    [trips],
  );

  const continentChips: ChipOption[] = useMemo(
    () => [
      { label: 'All continents', value: 'all' },
      ...availableContinents.map((c) => ({ label: c, value: c })),
    ],
    [availableContinents],
  );

  const countryChips: ChipOption[] = useMemo(
    () => [
      { label: 'All countries', value: 'all' },
      ...availableCountries.map((c) => ({ label: c, value: c })),
    ],
    [availableCountries],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Backdrop — tap to dismiss, standard bottom-sheet affordance. */}
      <Pressable
        style={styles.sheetBackdrop}
        onPress={handleClose}
        accessibilityLabel="Close filters"
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: theme.cardBackground }]}
      >
        <View style={styles.sheetGrabber} />

        {/* Header — back button on sub-screens, plain title on root. */}
        <View style={styles.sheetHeader}>
          {view !== 'root' ? (
            <Pressable
              onPress={resetView}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back to filters"
              style={[styles.sheetBack, { backgroundColor: theme.tagBackground }]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </Pressable>
          ) : null}
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
            {view === 'root'
              ? `Filters${activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}`
              : SUB_VIEW_TITLES[view]}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.sheetClose, { backgroundColor: theme.tagBackground }]}
          >
            <Ionicons name="close" size={18} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
          {view === 'root' ? (
            <View>
              {/* Trip first per user request — most trips-tab users think
                  "which trip" before they think about any other slice. */}
              <FilterRow
                icon="airplane-outline"
                label="Trip"
                value={tripLabel}
                active={tripId !== 'all'}
                onPress={() => setView('trip')}
                disabled={trips.length <= 1}
                disabledHint={trips.length <= 1 ? 'Add another trip to filter' : undefined}
              />
              <FilterRow
                icon="checkmark-circle-outline"
                label="Status"
                value={statusLabel}
                active={status !== 'all'}
                onPress={() => setView('status')}
              />
              <FilterRow
                icon="calendar-outline"
                label="Date range"
                value={dateLabel}
                active={dateRange !== 'all'}
                onPress={() => setView('date')}
              />
              <FilterRow
                icon="globe-outline"
                label="Continent"
                value={continentLabel}
                active={continent !== 'all'}
                onPress={() => setView('continent')}
                disabled={availableContinents.length === 0}
                disabledHint={
                  availableContinents.length === 0 ? 'No trip locations yet' : undefined
                }
              />
              <FilterRow
                icon="flag-outline"
                label="Country"
                value={countryLabel}
                active={country !== 'all'}
                onPress={() => setView('country')}
                disabled={availableCountries.length === 0}
                disabledHint={
                  availableCountries.length === 0 ? 'No trip locations yet' : undefined
                }
              />
            </View>
          ) : view === 'trip' ? (
            <FilterChips
              options={tripChips}
              selected={tripId === 'all' ? 'all' : String(tripId)}
              onSelect={(v) => {
                const label = tripChips.find((c) => c.value === v)?.label ?? 'Trip';
                onTripIdChange(v === 'all' ? 'all' : Number(v));
                onShowToast(`Trip: ${label}`, 'info');
                resetView();
              }}
              accessibilityLabel="Filter by trip"
            />
          ) : view === 'status' ? (
            <SegmentedPills
              options={STATUS_OPTIONS}
              selected={status}
              onSelect={(v) => {
                const label = STATUS_OPTIONS.find((o) => o.value === v)?.label ?? 'Status';
                onStatusChange(v);
                onShowToast(`Status: ${label}`, 'info');
                resetView();
              }}
              accessibilityLabel="Filter by status"
            />
          ) : view === 'date' ? (
            <DateRangeSubView
              dateRange={dateRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onSelect={(v) => {
                const label = DATE_RANGE_OPTIONS.find((o) => o.value === v)?.label ?? 'Date';
                onDateRangeChange(v);
                // Custom stays in-view so the user can pick start+end —
                // toast/return fires from the Apply button inside the sub-view.
                if (v !== 'custom') {
                  onShowToast(`Date range: ${label}`, 'info');
                  resetView();
                }
              }}
              onApplyCustom={(start, end) => {
                onCustomDateRangeChange(start, end);
                const label =
                  start && end
                    ? `${formatIsoDate(start)} – ${formatIsoDate(end)}`
                    : start
                      ? `From ${formatIsoDate(start)}`
                      : end
                        ? `Until ${formatIsoDate(end)}`
                        : 'Custom';
                onShowToast(`Date range: ${label}`, 'info');
                resetView();
              }}
            />
          ) : view === 'continent' ? (
            <FilterChips
              options={continentChips}
              selected={continent}
              onSelect={(v) => {
                const label = continentChips.find((c) => c.value === v)?.label ?? 'Continent';
                onContinentChange(v === 'all' ? 'all' : (v as Continent));
                onShowToast(`Continent: ${label}`, 'info');
                resetView();
              }}
              accessibilityLabel="Filter by continent"
            />
          ) : (
            <FilterChips
              options={countryChips}
              selected={country}
              onSelect={(v) => {
                const label = countryChips.find((c) => c.value === v)?.label ?? 'Country';
                onCountryChange(v);
                onShowToast(`Country: ${label}`, 'info');
                resetView();
              }}
              accessibilityLabel="Filter by country"
            />
          )}
        </ScrollView>

        <View style={[styles.sheetFooter, { borderColor: theme.cardBorder }]}>
          <Pressable
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            style={[styles.sheetClearBtn, { borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.sheetClearText, { color: theme.textPrimary }]}>
              Clear all
            </Text>
          </Pressable>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
            style={[styles.sheetApplyBtn, { backgroundColor: Palette.coral }]}
          >
            <Text style={styles.sheetApplyText}>Show results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Shadows.lg,
  },
  sheetGrabber: {
    alignSelf: 'center',
    backgroundColor: Palette.grey300,
    borderRadius: 3,
    height: 5,
    marginBottom: Spacing.sm,
    opacity: 0.6,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetClose: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sheetBack: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 30,
    justifyContent: 'center',
    marginRight: Spacing.sm,
    width: 30,
  },
  filterRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  filterRowPressed: {
    opacity: 0.7,
  },
  filterRowDisabled: {
    opacity: 0.45,
  },
  filterRowIcon: {
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  filterRowBody: {
    flex: 1,
  },
  filterRowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  filterRowValue: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  sheetBody: {
    paddingBottom: Spacing.lg,
  },
  customDateWrap: {
    marginTop: Spacing.md,
  },
  customDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  customDateApply: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  customDateApplyDisabled: {
    opacity: 0.5,
  },
  customDateApplyText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
  sheetFooter: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  sheetClearBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.md,
  },
  sheetClearText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetApplyBtn: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flex: 2,
    paddingVertical: Spacing.md,
  },
  sheetApplyText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
