import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '@/constants/colors';
import { getSetting, setSetting } from '@/db';
import type { ThemeColors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * The hook every component uses to read the current theme. Picks up
 * the user's preference from the database and falls back to the
 * device's light or dark setting when none is saved.
 */
export function useThemeProvider() {
  const deviceScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void getSetting('theme_mode').then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setModeState(val);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    void setSetting('theme_mode', newMode);
  }, []);

  const resolvedScheme = mode === 'system' ? deviceScheme : mode;
  const isDark = resolvedScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  return { theme, mode, isDark, setMode };
}

/**
 * Returns the active theme colours. Use in any component.
 */
export function useAppTheme(): ThemeColors {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.theme;
  // Fallback for components outside provider (e.g. tests)
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
}

/**
 * Returns full theme control (mode, isDark, setMode).
 * Use on settings/profile screen.
 */
export function useThemeControl() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControl must be used within ThemeContext.Provider');
  return ctx;
}
