/**
 * src/theme/useTheme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reactive theme hook for the SolarCoop "Solar Amber & Orange" brand.
 *
 * Uses the OS color scheme (react-native `useColorScheme`) so the app follows
 * the device Light / Dark setting automatically — no manual toggle needed.
 * Falls back to Light mode when the scheme is unknown (e.g. some web hosts).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useColorScheme } from 'react-native';
import { getTheme } from './colors';

export const useTheme = () => {
  const scheme = useColorScheme();
  return getTheme(scheme);
};
