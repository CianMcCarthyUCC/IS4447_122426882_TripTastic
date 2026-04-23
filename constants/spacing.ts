/**
 * The spacing scale used across the whole app. Every margin and padding
 * picks from this small set of sizes so every screen has the same
 * rhythm.
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
 * Border radius scale - modern rounded corners.
 */
export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

/**
 * Shadow presets - consistent elevation system.
 *
 * Shadow colour is warm espresso (#1F1C0E) rather than cool navy so it
 * harmonises with the cream-forward brand: a cool shadow on a warm
 * surface looks subtly "wrong" - warm-on-warm keeps the elevation feel
 * without fighting the hero colour.
 */
export const Shadows = {
  sm: {
    shadowColor: '#1F1C0E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1F1C0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1F1C0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
