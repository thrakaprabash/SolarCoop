import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { COLORS, GLASS } from './colors';
import { colors as tradeColors } from '../trade/theme/colors';
import { TECH_DARK as TECH } from '../technician/theme';
import { adaptStyles, lightColor } from './legacyTheme';
import { LIGHT_TONES as T, LIGHT_ACTION, DARK_ACTION, LIGHT_SWITCH } from './lightTones';

const lightLegacy = {
  ...COLORS,
  glassBg: '#FFFFFF', glassBgLight: '#EAF6F1', glassBorder: T.border, glassBorderLight: '#AECBD7',
  textBright: T.ink, textPrimary: T.ink, textSecondary: T.inkSecondary, textMuted: T.inkMuted,
  amber: T.warning, amberDark: '#6F4900', amberLight: T.warning, amberGlow: T.warningSoft,
  teal: T.success, tealLight: T.success, tealGlow: T.successSoft,
  blue: '#066FA2', blueLight: '#066FA2', blueGlow: T.primarySoft,
  red: T.danger, redGlow: T.dangerSoft,
  orange: '#B4530A', orangeLight: '#B4530A',
};
const lightGlass = Object.fromEntries(Object.entries(GLASS).map(([key, value]) => [key, {
  ...value, backgroundColor: key === 'pill' ? '#E4F2F8' : '#FFFFFF', borderColor: T.border,
}]));
const lightTrade = {
  ...tradeColors, base: '#F0F9FF', scrim: '#F0F9FF', navBar: '#FFFFFF',
  surface: '#FFFFFF', surfaceAlt: T.surfaceAlt, surfaceRaised: '#EAF6F1',
  border: T.border, borderSoft: '#D7E8EE', hairline: T.border,
  text: T.ink, textStrong: T.ink, textMuted: T.inkSecondary, textFaint: T.inkMuted,
  teal: T.success, tealLight: T.success, tealTint: T.successSoft, tealTintSoft: '#EAF6F1',
  tealTintStrong: '#C5EAD3', tealBorder: T.successBorder,
  amber: T.warning, amberLight: T.warning, amberTint: T.warningSoft, amberTintStrong: '#FFE58A', amberBorder: T.warningBorder, danger: T.danger,
  dangerTint: T.dangerSoft,
};
const lightTech = {
  ...TECH, bg: '#F0F9FF', card: '#FFFFFF', cardRaised: '#EAF6F1', border: T.border, borderStrong: '#AECBD7',
  orange: T.primary, orangeDark: T.primaryDark, orangeSoft: T.primarySoft, orangeBorder: '#85BFCE',
  text: T.ink, textSecondary: T.inkSecondary, textMuted: T.inkMuted,
  red: T.danger, amber: T.warning, green: T.success, blue: '#066FA2',
};
const darkTokens = { COLORS, GLASS, colors: tradeColors, TECH, themeColor: value => value, action: DARK_ACTION, switchTrack: null };
const lightTokens = { COLORS: lightLegacy, GLASS: lightGlass, colors: lightTrade, TECH: lightTech, themeColor: lightColor, action: LIGHT_ACTION, switchTrack: LIGHT_SWITCH };

/**
 * Theme-aware tokens for the older dark-first screens.
 * `action` holds the shared button looks (solid, tonal, neutral, danger,
 * dangerTonal, selected, idle, disabled). In dark mode every slot is empty so
 * a screen keeps its own styling: `style={[styles.btn, action.solid.box]}`.
 * `switchTrack` is the light Switch track pair (null in dark mode).
 */
export function useLegacyTheme() {
  return useTheme().isDark ? darkTokens : lightTokens;
}
export function useThemedStyles(baseStyles) {
  const { isDark } = useTheme();
  return useMemo(() => isDark ? baseStyles : adaptStyles(baseStyles), [baseStyles, isDark]);
}
