/**
 * src/theme/useTheme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared, reactive Light / Dark / Device preference from ThemeProvider.
 * Existing users default to Dark; explicit preferences persist across launches.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export const useTheme = () => {
  return useContext(ThemeContext);
};
