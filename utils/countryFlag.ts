/**
 * Country-name → flag emoji lookup.
 *
 * Covers the seeded demo destinations and common travel countries. Falls back
 * to a globe so the UI never renders a blank slot. Matching is case-sensitive
 * against the exact country string stored on a Trip.
 */

const COUNTRY_FLAGS: Record<string, string> = {
  Italy: '🇮🇹',
  France: '🇫🇷',
  UK: '🇬🇧',
  'United Kingdom': '🇬🇧',
  Ireland: '🇮🇪',
  Japan: '🇯🇵',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  Spain: '🇪🇸',
  Australia: '🇦🇺',
  Germany: '🇩🇪',
  Netherlands: '🇳🇱',
  Portugal: '🇵🇹',
  'Czech Republic': '🇨🇿',
  Czechia: '🇨🇿',
  Austria: '🇦🇹',
  Greece: '🇬🇷',
  Switzerland: '🇨🇭',
  Belgium: '🇧🇪',
  Denmark: '🇩🇰',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  Finland: '🇫🇮',
  Poland: '🇵🇱',
  Hungary: '🇭🇺',
  Croatia: '🇭🇷',
  Turkey: '🇹🇷',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  India: '🇮🇳',
  China: '🇨🇳',
  'South Korea': '🇰🇷',
  Korea: '🇰🇷',
  Singapore: '🇸🇬',
  'New Zealand': '🇳🇿',
  Morocco: '🇲🇦',
  Egypt: '🇪🇬',
  'South Africa': '🇿🇦',
  Iceland: '🇮🇸',
};

export function countryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🌍';
}
