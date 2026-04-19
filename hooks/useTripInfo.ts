import { useCallback, useEffect, useState } from 'react';
import { useMountedRef } from './useMountedRef';
import { getWeather, type WeatherData } from '@/utils/weatherApi';
import { getCountryInfo, type CountryData } from '@/utils/countriesApi';

type TripInfoState = {
  weather: WeatherData | null;
  countryInfo: CountryData | null;
  error: boolean;
  retry: () => void;
};

/**
 * Fetches weather + country metadata for a trip destination.
 * Pulled out of TripInfoBar so that card stays presentational and reusable.
 * Country is resolved first (gives the ISO code), then the weather call uses
 * that code for disambiguation ("Paris, FR" vs "Paris, TX").
 */
export function useTripInfo(city: string, country: string): TripInfoState {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [countryInfo, setCountryInfo] = useState<CountryData | null>(null);
  const [error, setError] = useState(false);
  const mounted = useMountedRef();

  const fetchAll = useCallback(async () => {
    setError(false);
    try {
      const countryResult = await getCountryInfo(country);
      if (!mounted.current) return;
      setCountryInfo(countryResult);

      const weatherResult = await getWeather(city, countryResult.isoCode);
      if (!mounted.current) return;
      setWeather(weatherResult);
    } catch {
      if (mounted.current) setError(true);
    }
  }, [city, country, mounted]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { weather, countryInfo, error, retry: fetchAll };
}
