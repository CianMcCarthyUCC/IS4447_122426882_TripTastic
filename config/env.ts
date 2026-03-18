/**
 * Centralised environment variable access.
 * All env vars flow through here so nothing is scattered across the codebase.
 * Expo automatically loads .env files and exposes EXPO_PUBLIC_* vars.
 */

export const env = {
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
} as const;
