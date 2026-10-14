import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { COLORS, GLASS } from './colors';
import { colors as tradeColors } from '../trade/theme/colors';
import { TECH_DARK as TECH } from '../technician/theme';
import { adaptStyles, lightColor } from './legacyTheme';

const lightLegacy = {
  ...COLORS,
  glassBg: '#FFFFFF', glassBgLight: '#EAF6F1', glassBorder: '#C7DFE7', glassBorderLight: '#AECBD7',
  textBright: '#09243B', textPrimary: '#09243B', textSecondary: '#405D70', textMuted: '#526F80',
  amber: '#936000', amberDark: '#805300', amberLight: '#936000', amberGlow: '#FFF2B8',
  teal: '#137B49', tealLight: '#137B49', tealGlow: '#DCF3E4',
  blue: '#066FA2', blueLight: '#066FA2', blueGlow: '#DDF2FA', red: '#C92B36',
};
const lightGlass = Object.fromEntries(Object.entries(GLASS).map(([key, value]) => [key, {
  ...value, backgroundColor: key === 'pill' ? '#E4F2F8' : '#FFFFFF', borderColor: '#C7DFE7',
}]));
const lightTrade = {
  ...tradeColors, base: '#F0F9FF', scrim: '#F0F9FF', navBar: '#FFFFFF',
  surface: '#FFFFFF', surfaceAlt: '#F4FAFD', surfaceRaised: '#EAF6F1',
  border: '#C7DFE7', borderSoft: '#D7E8EE', hairline: '#C7DFE7',
  text: '#09243B', textStrong: '#09243B', textMuted: '#405D70', textFaint: '#526F80',
  teal: '#137B49', tealLight: '#137B49', tealTint: '#DCF3E4', tealTintSoft: '#EAF6F1',
  tealTintStrong: '#C5EAD3', tealBorder: '#89CBA5',
  amber: '#936000', amberLight: '#936000', amberTint: '#FFF2B8', amberTintStrong: '#FFE58A', amberBorder: '#D4AE38', danger: '#C92B36',
};
const lightTech = {
  ...TECH, bg: '#F0F9FF', card: '#FFFFFF', cardRaised: '#EAF6F1', border: '#C7DFE7', borderStrong: '#AECBD7',
  orange: '#0676A1', orangeDark: '#075471', orangeSoft: '#DDF2FA', orangeBorder: '#85BFCE',
  text: '#09243B', textSecondary: '#405D70', textMuted: '#526F80',
  red: '#C92B36', amber: '#936000', green: '#167744', blue: '#066FA2',
};
const darkTokens = { COLORS, GLASS, colors: tradeColors, TECH, themeColor: value => value };
const lightTokens = { COLORS: lightLegacy, GLASS: lightGlass, colors: lightTrade, TECH: lightTech, themeColor: lightColor };

export function useLegacyTheme() {
  return useTheme().isDark ? darkTokens : lightTokens;
}
export function useThemedStyles(baseStyles) {
  const { isDark } = useTheme();
  return useMemo(() => isDark ? baseStyles : adaptStyles(baseStyles), [baseStyles, isDark]);
}
