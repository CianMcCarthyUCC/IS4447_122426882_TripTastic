/**
 * Centralised colour palette — deep blue + coral travel theme.
 * Every colour has a light and dark mode variant.
 * Import via useAppTheme() hook for automatic theme switching.
 */

export const Palette = {
  // Core brand
  navy: '#0A2463',
  navyLight: '#1B3A7B',
  skyBlue: '#166AD2',
  coral: '#FE7D50',
  coralDark: '#E56A3E',
  gold: '#FFB84D',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F5F7FA',
  grey50: '#F8FAFC',
  grey100: '#F1F5F9',
  grey200: '#E2E8F0',
  grey300: '#CBD5E1',
  grey400: '#94A3B8',
  grey500: '#64748B',
  grey600: '#475569',
  grey700: '#334155',
  grey800: '#1E293B',
  grey900: '#0F172A',
  black: '#020617',

  // Semantic
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#166AD2',
  infoLight: '#DBEAFE',
} as const;

/** Light mode colours */
export const LightTheme = {
  // Backgrounds
  screenBackground: Palette.offWhite,
  cardBackground: Palette.white,
  inputBackground: Palette.white,
  tagBackground: Palette.infoLight,
  headerBackground: Palette.navy,

  // Borders
  cardBorder: Palette.grey200,
  inputBorder: Palette.grey300,

  // Text
  textPrimary: Palette.grey900,
  textSecondary: Palette.grey500,
  textLabel: Palette.grey700,
  textButton: Palette.white,
  textButtonSecondary: Palette.navy,
  textOnHeader: Palette.white,

  // Brand / Actions
  primaryAction: Palette.navy,
  accentAction: Palette.coral,
  successAction: Palette.success,
  dangerAction: Palette.danger,

  // Tags
  tagLabel: Palette.skyBlue,
  tagValue: Palette.navy,

  // Overlay
  overlay: 'rgba(10, 36, 99, 0.6)',

  // Tab bar
  tabBarBackground: Palette.white,
  tabBarBorder: Palette.grey200,
  tabActive: Palette.coral,
  tabInactive: Palette.grey400,
} as const;

/** Dark mode colours */
export const DarkTheme = {
  // Backgrounds
  screenBackground: Palette.grey900,
  cardBackground: Palette.grey800,
  inputBackground: Palette.grey800,
  tagBackground: '#1E3A5F',
  headerBackground: Palette.black,

  // Borders
  cardBorder: Palette.grey700,
  inputBorder: Palette.grey600,

  // Text
  textPrimary: Palette.grey50,
  textSecondary: Palette.grey400,
  textLabel: Palette.grey300,
  textButton: Palette.white,
  textButtonSecondary: Palette.grey50,
  textOnHeader: Palette.white,

  // Brand / Actions
  primaryAction: Palette.skyBlue,
  accentAction: Palette.coral,
  successAction: '#34D399',
  dangerAction: '#F87171',

  // Tags
  tagLabel: '#60A5FA',
  tagValue: '#93C5FD',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Tab bar
  tabBarBackground: Palette.grey900,
  tabBarBorder: Palette.grey700,
  tabActive: Palette.coral,
  tabInactive: Palette.grey500,
} as const;

export type ThemeColors = {
  [K in keyof typeof LightTheme]: string;
};

/**
 * @deprecated Use useAppTheme() hook instead for theme-aware colours.
 * Kept for backward compatibility during migration.
 */
export const Colors = {
  ...LightTheme,
  light: LightTheme,
  dark: DarkTheme,
} as const;
