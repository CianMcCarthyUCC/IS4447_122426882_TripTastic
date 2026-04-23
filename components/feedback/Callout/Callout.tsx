import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableOpacity } from '@/components/buttons';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

export type CalloutRow = {
  label: string;
  value: string;
  /** Optional colour swatch shown before the label - handy for legends. */
  swatch?: string;
};

export type CalloutTone = 'light' | 'dark';

type Props = {
  /** Main headline on the card. */
  title?: string;
  /** Eyebrow label shown small + uppercase above the headline (e.g. "TOTAL"). */
  eyebrow?: string;
  /** Big primary metric value shown in place of rows (e.g. "345"). */
  primaryValue?: string;
  /** Unit attached to the primary value (e.g. "min"). */
  primaryUnit?: string;
  /** Supporting line shown at the bottom (e.g. a date). */
  subtitle?: string;
  /** Detail rows shown in a label / value grid. Hidden when a primaryValue is set. */
  rows?: CalloutRow[];
  /**
   * Surface tone. `light` (default) is the app's standard card chrome.
   * `dark` is a translucent dark card that pairs well with colourful
   * charts - matches the Apple Health tooltip look.
   */
  tone?: CalloutTone;
  /** Compact sizing for chart overlays - smaller type, tighter padding. */
  compact?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
};

/**
 * The reusable tooltip card used across the app for contextual detail
 * about a selected item (chart bar, pie slice, map pin). Supports two
 * visual tones and two content shapes - a "big number + eyebrow"
 * layout for chart tooltips, or a title + list of label/value rows
 * layout for general info popovers.
 */
function Callout({
  title,
  eyebrow,
  primaryValue,
  primaryUnit,
  subtitle,
  rows,
  tone = 'light',
  compact = false,
  onDismiss,
  dismissLabel = 'Dismiss',
}: Props) {
  const theme = useAppTheme();
  const isDark = tone === 'dark';

  const bg = isDark ? 'rgba(30, 30, 30, 0.9)' : theme.cardBackground;
  const border = isDark ? 'rgba(255, 255, 255, 0.1)' : theme.cardBorder;
  const primaryText = isDark ? Palette.white : theme.textPrimary;
  const secondaryText = isDark ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary;

  const showMetric = primaryValue !== undefined;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: bg, borderColor: border },
      ]}
      accessibilityRole="summary"
    >
      {onDismiss ? (
        <PressableOpacity
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={compact ? 12 : 16} color={secondaryText} />
        </PressableOpacity>
      ) : null}

      {eyebrow ? (
        <Text
          style={[styles.eyebrow, compact && styles.eyebrowCompact, { color: secondaryText }]}
          numberOfLines={1}
        >
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}

      {showMetric ? (
        <View style={styles.metricRow}>
          <Text
            style={[
              styles.metricValue,
              compact && styles.metricValueCompact,
              { color: primaryText },
            ]}
            numberOfLines={1}
          >
            {primaryValue}
          </Text>
          {primaryUnit ? (
            <Text
              style={[
                styles.metricUnit,
                compact && styles.metricUnitCompact,
                { color: secondaryText },
              ]}
              numberOfLines={1}
            >
              {primaryUnit}
            </Text>
          ) : null}
        </View>
      ) : title ? (
        <Text style={[styles.title, { color: primaryText }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={[styles.subtitle, compact && styles.subtitleCompact, { color: secondaryText }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}

      {!showMetric && rows && rows.length > 0 ? (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowLabelWrap}>
                {row.swatch ? (
                  <View style={[styles.swatch, { backgroundColor: row.swatch }]} />
                ) : null}
                <Text style={[styles.rowLabel, { color: secondaryText }]}>
                  {row.label}
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: primaryText }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default memo(Callout);

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingRight: Spacing.xxl,
    paddingVertical: Spacing.sm,
    position: 'relative',
    ...Shadows.sm,
  },
  cardCompact: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingRight: Spacing.lg,
    paddingVertical: 6,
  },
  eyebrowCompact: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  metricValueCompact: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  metricUnitCompact: {
    fontSize: 11,
  },
  subtitleCompact: {
    fontSize: 10,
  },
  closeBtn: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rows: {
    gap: 4,
    marginTop: Spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  swatch: {
    borderRadius: 3,
    height: 10,
    width: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
