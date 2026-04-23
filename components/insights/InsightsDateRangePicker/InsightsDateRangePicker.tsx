import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Palette, Spacing } from '@/constants';
import { DateRangeCalendar } from '@/components/forms';
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

type Props = {
  value: InsightsDateRangeValue;
  setValue: (v: InsightsDateRangeValue) => void;
  close: () => void;
  onToast?: (msg: string) => void;
};

/**
 * The date-range picker used on filter surfaces. Preset options stack on
 * the left; selecting "Custom" reveals a single range-selecting calendar
 * on the right (shared `DateRangeCalendar`). Two taps build the range,
 * then Apply commits it.
 */
export function InsightsDateRangePicker({ value, setValue, close, onToast }: Props) {
  const theme = useAppTheme();
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

  return (
    <View>
      <View style={styles.row}>
        <View
          style={styles.stack}
          accessibilityRole="tablist"
          accessibilityLabel="Filter by date range"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value.range;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelect(opt.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}
                style={({ pressed }) => [
                  styles.stackItem,
                  {
                    backgroundColor: active ? theme.accentAction : theme.segmentTrack,
                    borderColor: active ? theme.accentAction : theme.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.stackItemLabel,
                    { color: active ? Palette.white : theme.textPrimary },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isCustom ? (
          <View style={styles.calendarWrap}>
            <DateRangeCalendar
              start={draftStart}
              end={draftEnd}
              onChange={(s, e) => {
                setDraftStart(s);
                setDraftEnd(e);
              }}
            />
          </View>
        ) : null}
      </View>

      {isCustom ? (
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stack: {
    flexDirection: 'column',
    gap: Spacing.sm,
    width: 120,
  },
  stackItem: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: Spacing.md,
  },
  stackItemLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  calendarWrap: {
    flex: 1,
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
