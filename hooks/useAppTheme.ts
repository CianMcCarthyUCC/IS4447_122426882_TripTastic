import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';

/**
 * Returns the active theme colours based on the device colour scheme.
 * All components should use this instead of importing Colors directly.
 */
export function useAppTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
