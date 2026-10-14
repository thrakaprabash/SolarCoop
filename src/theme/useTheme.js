/**
 * src/theme/useTheme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared saved appearance, with support for a portal-specific override.
 * The technician workspace keeps its own per-user appearance controls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { ThemeOverrideContext } from './ThemeOverrideContext';

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  const override = useContext(ThemeOverrideContext);
  return override ? { ...theme, ...override } : theme;
};
