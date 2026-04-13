import { memo, useCallback, useEffect, useState } from 'react';
import { useMountedRef } from '@/hooks/useMountedRef';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Palette } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getWeather } from '@/utils/weatherApi';
import { getCountryInfo } from '@/utils/countriesApi';
import type { WeatherData } from '@/utils/weatherApi';
import type { CountryData } from '@/utils/countriesApi';

type Props = {
  city: string;
  country: string;
};

/**
 * Compact inline trip info bar — weather + country in one slim row.
 * Blends into the header area without dominating the screen.
 */
function TripInfoBar({ city, country }: Props) {
  const theme = useAppTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [countryInfo, setCountryInfo] = useState<CountryData | null>(null);
  const [error, setError] = useState(false);
  const mounted = useMountedRef();

  const fetchAll = useCallback(async () => {
    try {
      // Fetch country first to get ISO code, then use it for accurate weather
      const countryResult = await getCountryInfo(country);
      if (!mounted.current) return;
      setCountryInfo(countryResult);

      const weatherResult = await getWeather(city, countryResult.isoCode);
      if (!mounted.current) return;
      setWeather(weatherResult);
    } catch {
      if (mounted.current) setError(true);
    }
  }, [city, country]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  if (error && !weather && !countryInfo) return null;

  return (
    <View style={[styles.bar, { backgroundColor: theme.tagBackground }]}>
      {/* Weather */}
      {weather ? (
        <View style={styles.segment}>
          <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
          <Text style={[styles.text, { color: theme.textPrimary }]}>{weather.temp}°C</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>{city}</Text>
        </View>
      ) : (
        <View style={styles.segment}>
          <Ionicons name="partly-sunny" size={16} color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      {/* Country */}
      {countryInfo ? (
        <View style={styles.segment}>
          <Text style={styles.flag}>{countryInfo.flag}</Text>
          <Text style={[styles.text, { color: theme.textPrimary }]}>{countryInfo.currency}</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>{countryInfo.language}</Text>
        </View>
      ) : (
        <View style={styles.segment}>
          <Ionicons name="globe-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      )}

      {/* Retry on error */}
      {error && (
        <Pressable onPress={fetchAll} accessibilityLabel="Retry loading trip info" accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={Palette.coral} />
        </Pressable>
      )}
    </View>
  );
}

export default memo(TripInfoBar);

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  divider: {
    height: 20,
    marginHorizontal: Spacing.sm,
    width: 1,
  },
  weatherIcon: {
    height: 24,
    width: 24,
  },
  flag: {
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 12,
  },
});
