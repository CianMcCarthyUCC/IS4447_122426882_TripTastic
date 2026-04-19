/**
 * Country-name → continent lookup for the Insights filter pipeline.
 *
 * Covers the same country set as `countryFlag.ts` plus common aliases.
 * A country not in the map resolves to 'Other' rather than throwing — the
 * filter UI only surfaces continents that exist in the user's actual trip
 * set, so 'Other' is visible only when real trip data includes an
 * unmapped country (cue to extend this table).
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
