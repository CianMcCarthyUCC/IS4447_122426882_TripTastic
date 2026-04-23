/**
 * A lookup table that turns a country name into its continent, used by
 * the Insights screen when the user filters trips by continent. Any
 * country not yet in the list shows up as "Other".
 */

export const CONTINENTS = [
  'Europe',
  'Asia',
  'Africa',
  'North America',
  'South America',
  'Oceania',
  'Other',
] as const;

export type Continent = (typeof CONTINENTS)[number];

const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  // Europe
  Italy: 'Europe',
  France: 'Europe',
  UK: 'Europe',
  'United Kingdom': 'Europe',
  Ireland: 'Europe',
  Spain: 'Europe',
  Germany: 'Europe',
  Netherlands: 'Europe',
  Portugal: 'Europe',
  'Czech Republic': 'Europe',
  Czechia: 'Europe',
  Austria: 'Europe',
  Greece: 'Europe',
  Switzerland: 'Europe',
  Belgium: 'Europe',
  Denmark: 'Europe',
  Sweden: 'Europe',
  Norway: 'Europe',
  Finland: 'Europe',
  Poland: 'Europe',
  Hungary: 'Europe',
  Croatia: 'Europe',
  Turkey: 'Europe',
  Iceland: 'Europe',

  // Asia
  Japan: 'Asia',
  Thailand: 'Asia',
  Vietnam: 'Asia',
  India: 'Asia',
  China: 'Asia',
  'South Korea': 'Asia',
  Korea: 'Asia',
  Singapore: 'Asia',

  // Africa
  Morocco: 'Africa',
  Egypt: 'Africa',
  'South Africa': 'Africa',

  // North America
  USA: 'North America',
  'United States': 'North America',
  Canada: 'North America',
  Mexico: 'North America',

  // South America
  Brazil: 'South America',
  Argentina: 'South America',

  // Oceania
  Australia: 'Oceania',
  'New Zealand': 'Oceania',
};

export function countryToContinent(country: string): Continent {
  return COUNTRY_TO_CONTINENT[country] ?? 'Other';
}
