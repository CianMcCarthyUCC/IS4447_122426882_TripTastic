import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTripInfo } from '@/hooks/useTripInfo';

type Props = {
  city: string;
  country: string;
};

/**
 * Compact inline trip info bar — weather + currency + language in one slim row.
 * Presentational wrapper over `useTripInfo`; all data-fetching logic lives in
 * the hook so this component stays easy to test and restyle.
 */
function TripInfoBar({ city, country }: Props) {
  const theme = useAppTheme();
  const { weather, countryInfo, error, retry } = useTripInfo(city, country);

  // Total failure: show a visible, actionable retry row rather than a blank
  // space so the user knows the info panel is here and recoverable.
  if (error && !weather && !countryInfo) {
    return (
      <Pressable
        onPress={retry}
        style={[styles.bar, { backgroundColor: theme.infoStripBackground }]}
        accessibilityRole="button"
        accessibilityLabel="Trip info failed to load. Tap to retry."
      >
        <View style={styles.segment}>
          <Ionicons name="cloud-offline-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Trip info unavailable</Text>
        </View>
        <View style={[styles.segment, styles.segmentRight]}>
          <Ionicons name="refresh" size={16} color={Palette.coral} />
          <Text style={[styles.text, { color: Palette.coral }]}>Retry</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: theme.infoStripBackground }]}>
      {/* Weather */}
      {weather ? (
        <View style={styles.segment}>
          <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
          <Text style={[styles.text, { color: theme.textPrimary }]}>{weather.temp}°C</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>{city}</Text>
        </View>
      ) : (
        <View style={styles.segment}>
          <Ionicons name="partly-sunny" size={18} color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading…</Text>
        </View>
      )}

      {/* Currency */}
      {countryInfo ? (
        <View style={[styles.segment, styles.segmentRight]}>
          <Ionicons name="cash-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.text, { color: theme.textPrimary }]}>{capitalise(countryInfo.currency)}</Text>
        </View>
      ) : (
        <View style={[styles.segment, styles.segmentRight]}>
          <Ionicons name="cash-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading…</Text>
        </View>
      )}

      {/* Language */}
      {countryInfo ? (
        <View style={[styles.segment, styles.segmentRight]}>
          <Ionicons name="language-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.text, { color: theme.textPrimary }]}>{countryInfo.language}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default memo(TripInfoBar);

// Upper-cases only the first character. REST Countries returns currency names
// lowercase ("euro (€)"); display wants sentence case ("Euro (€)").
function capitalise(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segmentRight: {
    justifyContent: 'flex-end',
  },
  weatherIcon: {
    height: 26,
    width: 26,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 13,
  },
});
