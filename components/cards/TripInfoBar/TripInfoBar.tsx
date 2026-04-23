import { memo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTripInfo } from '@/hooks/useTripInfo';

type Props = {
  city: string;
  country: string;
};

/**
 * A slim row at the top of a trip showing local weather, currency and
 * language for the destination. Pulls the data from `useTripInfo` so this
 * component stays focused purely on how the row looks. Each segment
 * surfaces its own loading spinner or "Error Loading" pill so one failing
 * API doesn't blank out the others.
 */
function TripInfoBar({ city, country }: Props) {
  const theme = useAppTheme();
  const {
    weather,
    countryInfo,
    weatherLoading,
    weatherError,
    countryLoading,
    countryError,
    retry,
  } = useTripInfo(city, country);

  return (
    <View style={[styles.bar, { backgroundColor: theme.infoStripBackground }]}>
      {/* Weather */}
      <View style={styles.segment}>
        {weatherLoading ? (
          <>
            <ActivityIndicator size="small" color={theme.textSecondary} />
            <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading…</Text>
          </>
        ) : weatherError ? (
          <ErrorPill onRetry={retry} textColor={theme.textSecondary} label="weather" />
        ) : weather ? (
          <>
            <Image
              source={{ uri: weather.icon }}
              style={styles.weatherIcon}
              accessibilityLabel={`Weather icon: ${weather.description ?? 'current conditions'}`}
              accessibilityRole="image"
            />
            <Text style={[styles.text, { color: theme.textPrimary }]}>{weather.temp}°C</Text>
            <Text style={[styles.subtext, { color: theme.textSecondary }]}>{city}</Text>
          </>
        ) : null}
      </View>

      {countryLoading ? (
        /* Currency + language share the same country fetch, so a single
           combined pill keeps the row tidy while the lookup is in-flight. */
        <View style={[styles.segment, styles.segmentRight]}>
          <ActivityIndicator size="small" color={theme.textSecondary} />
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>Loading Country Info…</Text>
        </View>
      ) : (
        <>
          {/* Currency */}
          <View style={[styles.segment, styles.segmentCenter]}>
            {countryError ? (
              <ErrorPill onRetry={retry} textColor={theme.textSecondary} label="currency" />
            ) : countryInfo ? (
              <>
                <Ionicons name="cash-outline" size={20} color={theme.textPrimary} />
                <Text
                  style={[styles.text, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {formatCurrency(countryInfo.currency, countryInfo.currencySymbol)}
                </Text>
              </>
            ) : null}
          </View>

          {/* Language */}
          <View style={[styles.segment, styles.segmentRight]}>
            {countryError ? null : countryInfo ? (
              <>
                <Ionicons name="language-outline" size={20} color={theme.textPrimary} />
                <Text
                  style={[styles.text, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {countryInfo.language}
                </Text>
              </>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

export default memo(TripInfoBar);

// Prefer "EUR (€)" so users see the code (scannable) alongside the
// familiar symbol. Falls back to just the code for currencies without a
// symbol in the REST Countries response.
function formatCurrency(code: string, symbol: string): string {
  return symbol ? `${code} (${symbol})` : code;
}

type ErrorPillProps = {
  onRetry: () => void;
  textColor: string;
  label: string;
};

function ErrorPill({ onRetry, textColor, label }: ErrorPillProps) {
  return (
    <Pressable
      onPress={onRetry}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${label} failed to load. Tap to retry.`}
      style={styles.errorPill}
    >
      <Text style={[styles.subtext, { color: textColor }]}>Error Loading</Text>
      <Ionicons name="information-circle-outline" size={16} color={textColor} />
    </Pressable>
  );
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
  segmentCenter: {
    justifyContent: 'center',
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
  errorPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
