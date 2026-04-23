/**
 * Turns a country name into its flag emoji so trip cards and headers can
 * show the flag at a glance. Falls back to a globe when the country is
 * not in the list, so the UI never looks broken.
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
