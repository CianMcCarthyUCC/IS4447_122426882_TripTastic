import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Palette, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatIsoDate } from '@/utils/dateHelpers';

type Props = {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  /** Optional lower bound (inclusive) - e.g. today for future-only ranges. */
  minDate?: string;
  /** Optional upper bound (inclusive). */
  maxDate?: string;
  /** Hides the helper line above the calendar when false. */
  showSummary?: boolean;
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  const cursor = new Date(`${lo}T00:00:00`);
  const stop = new Date(`${hi}T00:00:00`);
  while (cursor <= stop) {
    out.push(iso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * A single-calendar date-range picker. Tap a start day, then an end day;
 * days in between highlight in the accent colour. A third tap starts a
 * fresh selection. Shared by the insights/activities filter sheet and the
 * trip add/edit forms so every range-selection surface feels identical.
 */
function DateRangeCalendarInner({
  start,
  end,
  onChange,
  minDate,
  maxDate,
  showSummary = true,
}: Props) {
  const theme = useAppTheme();

  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      const picked = day.dateString;
      if (!start || (start && end)) {
        onChange(picked, null);
        return;
      }
      if (picked < start) {
        onChange(picked, start);
      } else {
        onChange(start, picked);
      }
    },
    [start, end, onChange],
  );

  const markedDates = useMemo(() => {
    if (!start && !end) return {};
    const marks: Record<string, any> = {};
    const color = Palette.coral;
    const textColor = Palette.white;
    if (start && end) {
      const days = datesBetween(start, end);
      days.forEach((d, i) => {
        marks[d] = {
          color,
          textColor,
          startingDay: i === 0,
          endingDay: i === days.length - 1,
        };
      });
    } else if (start) {
      marks[start] = { color, textColor, startingDay: true, endingDay: true };
    }
    return marks;
  }, [start, end]);

  const summary =
    start && end
      ? `${formatIsoDate(start)} – ${formatIsoDate(end)}`
      : start
        ? `Start: ${formatIsoDate(start)} · tap an end date`
        : 'Tap a start date, then an end date';

  return (
    <View>
      {showSummary ? (
        <Text style={[styles.summary, { color: theme.textSecondary }]}>{summary}</Text>
      ) : null}
      <Calendar
        onDayPress={handleDayPress}
        markingType="period"
        markedDates={markedDates}
        minDate={minDate}
        maxDate={maxDate}
        theme={{
          backgroundColor: theme.cardBackground,
          calendarBackground: theme.cardBackground,
          textSectionTitleColor: theme.textSecondary,
          dayTextColor: theme.textPrimary,
          monthTextColor: theme.textPrimary,
          arrowColor: Palette.coral,
          todayTextColor: Palette.coral,
          textDisabledColor: theme.textSecondary,
        }}
      />
    </View>
  );
}

export const DateRangeCalendar = memo(DateRangeCalendarInner);

const styles = StyleSheet.create({
  summary: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
});
