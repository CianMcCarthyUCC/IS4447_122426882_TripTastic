const BASE_URL = 'https://restcountries.com/v3.1';

export type CountryData = {
  name: string;
  isoCode: string;
  capital: string;
  currency: string;
  currencySymbol: string;
  language: string;
  timezone: string;
  flag: string;
  population: number;
};

// Common shorthand that users type but REST Countries can't resolve on its
// own — "UK" fuzzy-matches North Korea, "USA" doesn't match at all. Keyed
// uppercase for a case-insensitive lookup.
const ALIASES: Record<string, string> = {
  UK: 'United Kingdom',
  'GREAT BRITAIN': 'United Kingdom',
  ENGLAND: 'United Kingdom',
  SCOTLAND: 'United Kingdom',
  WALES: 'United Kingdom',
  USA: 'United States',
  US: 'United States',
  'U.S.': 'United States',
  'U.S.A.': 'United States',
  UAE: 'United Arab Emirates',
  'SOUTH KOREA': 'Korea, Republic of',
  'NORTH KOREA': "Korea, Democratic People's Republic of",
  HOLLAND: 'Netherlands',
  BURMA: 'Myanmar',
  IVORY_COAST: "Côte d'Ivoire",
};

/**
 * Looks up country details from the public REST Countries service, used
 * to show currency, language and a country code for other API calls.
 * Resolves common shorthand ("UK", "USA") to the canonical name first so
 * the fuzzy `/name` search can't drift onto the wrong country.
 */
export async function getCountryInfo(countryName: string): Promise<CountryData> {
  const resolved = ALIASES[countryName.trim().toUpperCase()] ?? countryName;
  const fields = 'fields=name,cca2,capital,currencies,languages,timezones,flag,population';

  // Try an exact-name match first — the loose `/name` endpoint is what caused
  // "UK" to resolve to North Korea. If that 404s (country not in the canonical
  // name list), fall back to the loose search on the original input.
  let response = await fetch(
    `${BASE_URL}/name/${encodeURIComponent(resolved)}?fullText=true&${fields}`,
  );
  if (!response.ok) {
    response = await fetch(`${BASE_URL}/name/${encodeURIComponent(resolved)}?${fields}`);
  }
  if (!response.ok) {
    throw new Error(`Countries API error: ${response.status}`);
  }

  const data = await response.json();
  const country = pickBestMatch(data, resolved);

  // REST Countries keys currencies by ISO code (e.g. { GBP: { name, symbol } }),
  // so grab the first entry's key as the abbreviation users actually scan for.
  const currencyEntries = Object.entries(country.currencies ?? {}) as Array<[
    string,
    { name: string; symbol: string },
  ]>;
  const languages = Object.values(country.languages ?? {}) as string[];

  return {
    name: country.name.common,
    isoCode: country.cca2 ?? '',
    capital: country.capital?.[0] ?? 'Unknown',
    currency: currencyEntries.length > 0 ? currencyEntries[0][0] : 'Unknown',
    currencySymbol: currencyEntries.length > 0 ? (currencyEntries[0][1]?.symbol ?? '') : '',
    language: languages[0] ?? 'Unknown',
    timezone: country.timezones?.[0] ?? 'Unknown',
    flag: country.flag ?? '',
    population: country.population ?? 0,
  };
}

// REST Countries returns matches in arbitrary order, so a loose search for
// "India" can surface "British Indian Ocean Territory" first. Prefer an
// exact common-name hit before falling back to the first result.
function pickBestMatch(results: Array<any>, query: string): any {
  const needle = query.toLowerCase();
  const exact = results.find((c) => c?.name?.common?.toLowerCase() === needle);
  if (exact) return exact;
  const official = results.find((c) => c?.name?.official?.toLowerCase() === needle);
  if (official) return official;
  return results[0];
}
