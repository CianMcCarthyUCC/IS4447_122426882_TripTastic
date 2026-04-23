import { useCallback, useEffect, useState } from 'react';
import { useMountedRef } from './useMountedRef';
import { getWeather, type WeatherData } from '@/utils/weatherApi';
import { getCountryInfo, type CountryData } from '@/utils/countriesApi';

type TripInfoState = {
  weather: WeatherData | null;
  countryInfo: CountryData | null;
  weatherLoading: boolean;
  weatherError: boolean;
  countryLoading: boolean;
  countryError: boolean;
  retry: () => void;
};

/**
 * Fetches the weather, currency and language for a trip destination.
 * Looks up the country first so the weather call can tell the right
 * "Paris" apart from the wrong one. Tracks loading and error state for
 * each API independently so the UI can surface a spinner or an "Error
 * loading" pill per segment instead of collapsing the whole row on a
 * single failure.
 */
export function useTripInfo(city: string, country: string): TripInfoState {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [countryInfo, setCountryInfo] = useState<CountryData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [countryLoading, setCountryLoading] = useState(true);
  const [countryError, setCountryError] = useState(false);
  const mounted = useMountedRef();

  const fetchAll = useCallback(async () => {
    setWeatherError(false);
    setCountryError(false);
    setCountryLoading(true);
    setWeatherLoading(true);

    let isoCode: string | undefined;
    try {
      const countryResult = await getCountryInfo(country);
      if (!mounted.current) return;
      setCountryInfo(countryResult);
      isoCode = countryResult.isoCode;
    } catch {
      if (!mounted.current) return;
      setCountryError(true);
    } finally {
      if (mounted.current) setCountryLoading(false);
    }

    try {
      const weatherResult = await getWeather(city, isoCode);
      if (!mounted.current) return;
      setWeather(weatherResult);
    } catch {
      if (!mounted.current) return;
      setWeatherError(true);
    } finally {
      if (mounted.current) setWeatherLoading(false);
    }
  }, [city, country, mounted]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return {
    weather,
    countryInfo,
    weatherLoading,
    weatherError,
    countryLoading,
    countryError,
    retry: fetchAll,
  };
}
