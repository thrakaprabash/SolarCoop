/**
 * src/theme/colors.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SolarCoop brand theme — "Solar Amber & Orange".
 *
 * Two complete, high-contrast palettes are provided:
 *   • Light mode — pure White (#FFFFFF) base, Warm Cream cards, Solar Orange
 *     (#ED8936) primary with a hint of Solar Red (#F56565) for destructive
 *     actions.
 *   • Dark mode  — Premium Dark (#121212) base, Dark Charcoal (#1E1E1E)
 *     cards, Solar Orange (#ED8936) accents and borders.
 *
 * Usage (new code):
 *   import { useTheme } from '../theme/useTheme';
 *   const theme = useTheme();            // reactive to the OS scheme
 *   theme.colors.background / theme.colors.primary / theme.colors.text …
 *
 * The legacy `COLORS`, `GLASS` and `SHADOWS` exports are preserved verbatim
 * for the older glass-morphism surfaces (dashboard / trade / admin), so this
 * refactor stays fully backward compatible.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';

/* ─── Brand palette tokens ──────────────────────────────────────────────── */
export const PALETTE = {
  // Solar Orange family (primary brand)
  solarOrange: '#ED8936',
  solarOrangeLight: '#F6AD55',
  solarOrangeDark: '#C05621',
  solarAmber: '#F6AD55',

  // Solar Red family (destructive)
  solarRed: '#F56565',
  solarRedDark: '#C53030',
  solarRedSoft: '#FED7D7',

  // Sun glow
  sunGlow: 'rgba(237, 137, 54, 0.35)',
  sunGlowSoft: 'rgba(237, 137, 54, 0.14)',

  // Light neutrals
  lightBg: '#FFFFFF',
  lightCard: '#FFF9F2',            // Warm Cream / Off-White
  lightCardAlt: '#FFF3E6',
  lightText: '#221408',
  lightTextSecondary: '#6F5B45',
  lightTextMuted: '#A89A8C',
  lightBorder: '#F0E3D3',
  lightInputBorder: '#E5D8C8',
  lightTrack: '#F4EBDF',
  lightOverlay: 'rgba(34, 20, 8, 0.45)',

  // Dark neutrals
  darkBg: '#121212',               // Premium Dark / Black
  darkCard: '#1E1E1E',             // Dark Charcoal
  darkCardAlt: '#26241F',
  darkText: '#F7F3EE',
  darkTextSecondary: 'rgba(247, 243, 238, 0.66)',
  darkTextMuted: 'rgba(247, 243, 238, 0.42)',
  darkBorder: 'rgba(255, 255, 255, 0.09)',
  darkInputBorder: 'rgba(255, 255, 255, 0.14)',
  darkTrack: 'rgba(255, 255, 255, 0.08)',
  darkOverlay: 'rgba(0, 0, 0, 0.6)',
};

/* ─── Theme factory ─────────────────────────────────────────────────────── */
const createTheme = (mode) => {
  const isDark = mode === 'dark';

  const colors = isDark
    ? {
        mode,
        isDark: true,
        background: PALETTE.darkBg,
        card: PALETTE.darkCard,
        cardAlt: PALETTE.darkCardAlt,
        text: PALETTE.darkText,
        textSecondary: PALETTE.darkTextSecondary,
        textMuted: PALETTE.darkTextMuted,
        border: PALETTE.darkBorder,
        inputBg: 'rgba(255, 255, 255, 0.05)',
        inputBorder: PALETTE.darkInputBorder,
        inputBorderFocus: PALETTE.solarOrangeLight,
        track: PALETTE.darkTrack,
        overlay: PALETTE.darkOverlay,
        primary: PALETTE.solarOrange,
        primaryLight: PALETTE.solarOrangeLight,
        primaryDark: PALETTE.solarOrangeDark,
        primarySoft: 'rgba(237, 137, 54, 0.18)',
        onPrimary: '#FFFFFF',
        danger: PALETTE.solarRed,
        dangerDark: PALETTE.solarRedDark,
        dangerSoft: 'rgba(245, 101, 101, 0.16)',
        onDanger: '#FFFFFF',
        success: '#48BB78',
        avatarText: PALETTE.solarOrangeDark,
        glow: 'rgba(237, 137, 54, 0.4)',
      }
    : {
        mode,
        isDark: false,
        background: PALETTE.lightBg,
        card: PALETTE.lightCard,
        cardAlt: PALETTE.lightCardAlt,
        text: PALETTE.lightText,
        textSecondary: PALETTE.lightTextSecondary,
        textMuted: PALETTE.lightTextMuted,
        border: PALETTE.lightBorder,
        inputBg: PALETTE.lightBg,
        inputBorder: PALETTE.lightInputBorder,
        inputBorderFocus: PALETTE.solarOrange,
        track: PALETTE.lightTrack,
        overlay: PALETTE.lightOverlay,
        primary: PALETTE.solarOrange,
        primaryLight: PALETTE.solarOrangeLight,
        primaryDark: PALETTE.solarOrangeDark,
        primarySoft: 'rgba(237, 137, 54, 0.12)',
        onPrimary: '#FFFFFF',
        danger: PALETTE.solarRed,
        dangerDark: PALETTE.solarRedDark,
        dangerSoft: 'rgba(245, 101, 101, 0.1)',
        onDanger: '#FFFFFF',
        success: '#2F9E63',
        avatarText: PALETTE.solarOrangeDark,
        glow: 'rgba(237, 137, 54, 0.28)',
      };

  return {
    mode,
    isDark,
    colors,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 8, md: 14, lg: 20, xl: 26, pill: 999 },
  };
};

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
export const themes = { light: lightTheme, dark: darkTheme };

/** Resolve a theme object for a color-scheme string ('light' | 'dark' | null). */
export const getTheme = (scheme) => themes[scheme === 'dark' ? 'dark' : 'light'];

/* ─────────────────────────────────────────────────────────────────────────
 * Legacy exports — used by the pre-existing glass surfaces.
 * ───────────────────────────────────────────────────────────────────────── */
export const COLORS = {
  // Glass Surface Colors
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBgLight: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderLight: 'rgba(255, 255, 255, 0.25)',

  // Solar Amber Accents
  amber: '#F59E0B',
  amberDark: '#D97706',
  amberLight: '#FBBF24',
  amberGlow: 'rgba(245, 158, 11, 0.35)',

  // Clean Energy Teal
  teal: '#14B8A6',
  tealLight: '#2DD4BF',
  tealGlow: 'rgba(20, 184, 166, 0.3)',

  // Alert Red
  red: '#EF4444',
  redGlow: 'rgba(239, 68, 68, 0.3)',

  // White Text Hierarchy
  textBright: '#FFFFFF',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.35)',
};

export const GLASS = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
  },
  cardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 50,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
  },
};

export const SHADOWS = {
  glass: Platform.select({
    web: {
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
  glow: Platform.select({
    web: {
      boxShadow: '0px 4px 16px rgba(245, 158, 11, 0.4)',
    },
    default: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
  }),
};
