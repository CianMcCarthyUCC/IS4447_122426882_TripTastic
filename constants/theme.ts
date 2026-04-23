import { Platform } from 'react-native';

/**
 * The serif font used on hero titles such as "Summer in Italy". Kept in
 * one place so every hero across the app shares the same look.
 */
export const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});
