const BASE_URL = 'https://restcountries.com/v3.1';

export type CountryData = {
  name: string;
  isoCode: string;
  capital: string;
  currency: string;
  language: string;
  timezone: string;
  flag: string;
  population: number;
};

/**
 * Fetches country info from REST Countries API (no API key needed).
 * Returns ISO code (cca2) which is needed by OpenWeatherMap.
 */
export async function getCountryInfo(countryName: string): Promise<CountryData> {
  const url = `${BASE_URL}/name/${encodeURIComponent(countryName)}?fields=name,cca2,capital,currencies,languages,timezones,flag,population`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Countries API error: ${response.status}`);
  }

  const data = await response.json();
  const country = data[0];

  const currencies = Object.values(country.currencies ?? {}) as Array<{ name: string; symbol: string }>;
  const languages = Object.values(country.languages ?? {}) as string[];

  return {
    name: country.name.common,
    isoCode: country.cca2 ?? '',
    capital: country.capital?.[0] ?? 'Unknown',
    currency: currencies.length > 0 ? `${currencies[0].name} (${currencies[0].symbol})` : 'Unknown',
    language: languages[0] ?? 'Unknown',
    timezone: country.timezones?.[0] ?? 'Unknown',
    flag: country.flag ?? '',
    population: country.population ?? 0,
  };
}
