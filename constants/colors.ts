/**
 * Centralised color palette — single source of truth for all colors.
 * Import from here instead of hardcoding hex values in components.
 */

export const Colors = {
  // Backgrounds
  screenBackground: '#F8FAFC',
  cardBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
  tagBackground: '#EFF6FF',

  // Borders
  cardBorder: '#E5E7EB',
  inputBorder: '#CBD5E1',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLabel: '#334155',
  textButton: '#FFFFFF',
  textButtonSecondary: '#0F172A',

  // Brand / Actions
  primaryAction: '#0F766E',
  dangerAction: '#B91C1C',

  // Tags
  tagLabel: '#1D4ED8',
  tagValue: '#1E3A8A',

  // Theme (light / dark)
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
} as const;
