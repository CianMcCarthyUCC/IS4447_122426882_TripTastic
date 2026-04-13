/**
 * Spacing scale — consistent rhythm across the app.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Border radius scale — modern rounded corners.
 */
export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

/**
 * Shadow presets — consistent elevation system.
 */
export const Shadows = {
  sm: {
    shadowColor: '#0A2463',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0A2463',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0A2463',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
