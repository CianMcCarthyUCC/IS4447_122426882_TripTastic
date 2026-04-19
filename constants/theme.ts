import { Platform } from 'react-native';

/**
 * Editorial serif used on the hero / card titles ("Summer in Italy").
 * Platform-specific so iOS gets Georgia (warm, travel-magazine tone) and
 * Android falls back to its bundled generic serif. Duplicated inline in
 * `TripCard` and `TripHero` before consolidation — sharing the constant
 * keeps the two surfaces visually consistent if the font ever changes.
 */
export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});
