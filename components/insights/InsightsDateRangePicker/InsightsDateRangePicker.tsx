import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { SegmentedPills } from '@/components/forms';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatIsoDate } from '@/utils/dateHelpers';
import type { InsightsDateRange } from '@/hooks';

export type InsightsDateRangeValue = {
  range: InsightsDateRange;
  customStart: string | null;
  customEnd: string | null;
};

const OPTIONS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
] as const;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Props = {
  value: InsightsDateRangeValue;
  setValue: (v: InsightsDateRangeValue) => void;
  close: () => void;
  onToast?: (msg: string) => void;
};

/**
 * The date-range picker used in the Insights filter sheet. Lets the user
 * pick a preset range (today, week, month, all time) or a custom start
 * and end date, so they can narrow the insights to the period they care
 * about.
 */
export function InsightsDateRangePicker({ value, setValue, close, onToast }: Props) {
  const theme = useAppTheme();
  // Local draft so the parent filter isn't re-applied on every picker tap.
  const [draftStart, setDraftStart] = useState<string | null>(value.customStart);
  const [draftEnd, setDraftEnd] = useState<string | null>(value.customEnd);

  const handleSelect = (range: InsightsDateRange) => {
    if (range === 'custom') {
      setValue({ range, customStart: draftStart, customEnd: draftEnd });
    } else {
      setValue({ range, customStart: null, customEnd: null });
      onToast?.(`Date range: ${OPTIONS.find((o) => o.value === range)?.label ?? 'All'}`);
      close();
    }
  };

  const applyCustom = () => {
    setValue({ range: 'custom', customStart: draftStart, customEnd: draftEnd });
    const label =
      draftStart && draftEnd
        ? `${formatIsoDate(draftStart)} - ${formatIsoDate(draftEnd)}`
        : draftStart
          ? `From ${formatIsoDate(draftStart)}`
          : draftEnd
            ? `Until ${formatIsoDate(draftEnd)}`
            : 'Custom';
    onToast?.(`Date range: ${label}`);
    close();
  };

  const isCustom = value.range === 'custom';
  const startAsDate = draftStart ? new Date(`${draftStart}T00:00:00`) : new Date();
  const endAsDate = draftEnd ? new Date(`${draftEnd}T00:00:00`) : new Date();

  return (
    <View>
      <SegmentedPills
        options={OPTIONS}
        selected={value.range}
        onSelect={handleSelect}
        accessibilityLabel="Filter by date range"
        accentActive
      />
      {isCustom ? (
        <View style={styles.customWrap}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>START DATE</Text>
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            value={startAsDate}
            maximumDate={draftEnd ? new Date(`${draftEnd}T00:00:00`) : undefined}
            onChange={(_e, d) => {
              if (d) setDraftStart(iso(d));
            }}
            accessibilityLabel="Custom start date"
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>END DATE</Text>
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            value={endAsDate}
            minimumDate={draftStart ? new Date(`${draftStart}T00:00:00`) : undefined}
            onChange={(_e, d) => {
              if (d) setDraftEnd(iso(d));
            }}
            accessibilityLabel="Custom end date"
          />
          <Pressable
            onPress={applyCustom}
            disabled={!draftStart && !draftEnd}
            accessibilityRole="button"
            accessibilityLabel="Apply custom date range"
            style={({ pressed }) => [
              styles.apply,
              { backgroundColor: Palette.coral },
              !draftStart && !draftEnd && styles.applyDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.applyText}>Apply range</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  customWrap: {
    marginTop: Spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  apply: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  applyDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  applyText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
