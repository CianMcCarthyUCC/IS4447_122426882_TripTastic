/**
 * Centralised colour palette — deep blue + coral travel theme.
 * Every colour has a light and dark mode variant.
 * Import via useAppTheme() hook for automatic theme switching.
 */

export const Palette = {
  // Core brand.
  //
  // `navy` is the deep anchor colour used for the top header, primary
  // buttons, outline text on secondary buttons, and tag values. It used
  // to be a literal navy blue (#0A2463) but now sits on the same warm
  // yellow hue axis as the app's cream accent — effectively a very dark
  // cream. This keeps dark surfaces on-palette with any warm elements
  // elsewhere in the UI without introducing a second hue family.
  navy: '#2E2910',
  navyLight: '#4A4320',
  skyBlue: '#166AD2',
  coral: '#FE7D50',
  coralDark: '#E56A3E',
  gold: '#FFB84D',
  // AI accent — violet reserved for AI-generated surfaces (currently the
  // Gemini travel-guide card). Kept distinct from the navy/coral CTA pair
  // so "AI" never competes with primary user actions for visual weight.
  aiViolet: '#8B5CF6',
  // Cream — pale yellow surface used as the source for the dark `navy`
  // above (it's essentially the same hue family taken way deeper). Not
  // currently bound to a theme token, but kept in the palette so warm
  // highlights can reference it directly if needed later.
  cream: '#FDFBD4',

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
  // Tag surface sits on the same warm hue family as `navy`/`cream` so
  // chips feel native to the brand palette instead of a stray cool blue.
  tagBackground: '#F5EEDC',
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

  // Tags — warm deep navy pulls double-duty as icon + label tint so the
  // chip reads as one unit. The value stays in the project's neutral
  // body-text colour to preserve label/value contrast.
  tagLabel: Palette.navy,
  tagValue: Palette.grey700,

  // Overlay — matches the new warm-dark navy so modal scrims tint the
  // scene on-brand instead of leaving a cool blue wash behind.
  overlay: 'rgba(46, 41, 16, 0.6)',

  // Tab bar
  tabBarBackground: Palette.white,
  tabBarBorder: Palette.grey200,
  tabActive: Palette.coral,
  tabInactive: Palette.grey400,

  // Info strip / segmented control track — soft low-contrast surfaces
  // referenced by TripInfoBar + SegmentedPills.
  infoStripBackground: Palette.infoLight,
  segmentTrack: Palette.grey100,
  segmentPillActive: Palette.white,
} as const;

/** Dark mode colours */
export const DarkTheme = {
  // Backgrounds
  screenBackground: Palette.grey900,
  cardBackground: Palette.grey800,
  inputBackground: Palette.grey800,
  // Warm dark chip surface — matches the navy hue family used in light
  // mode but shifted to a contrast-friendly shade for dark backgrounds.
  tagBackground: '#3A3218',
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

  // Tags — warm cream label on the dark warm chip, neutral value.
  tagLabel: Palette.cream,
  tagValue: Palette.grey300,

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Tab bar
  tabBarBackground: Palette.grey900,
  tabBarBorder: Palette.grey700,
  tabActive: Palette.coral,
  tabInactive: Palette.grey500,

  // Info strip / segmented control track
  infoStripBackground: '#1E3A5F',
  segmentTrack: Palette.grey800,
  segmentPillActive: Palette.grey700,
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
