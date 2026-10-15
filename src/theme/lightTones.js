// Light-theme colour roles shared by every portal (member, trade, admin, technician).
//
//   blue  solid / tonal / outline  every action button
//   sun   pale yellow + brown      the selected tab, chip, toggle or filter
//   green and red                  status and destructive actions only, never a plain button
//
// Every text/background pair below is asserted at 4.5:1 or better in
// theme.test.cjs. The dark theme does not read this file.
export const LIGHT_TONES = {
  primary: '#0676A1',
  primaryDark: '#075471',
  primarySoft: '#DDF2FA',
  primaryBorder: '#85BFCE',
  danger: '#C0262F',
  dangerDark: '#9F1F27',
  dangerSoft: '#FCE8EA',
  dangerBorder: '#F0B5BA',
  success: '#0F6B3C',
  successFill: '#137B49',
  successSoft: '#DCF3E4',
  successBorder: '#89CBA5',
  warning: '#855700',
  warningSoft: '#FFF2B8',
  warningBorder: '#D9B44A',
  ink: '#09243B',
  inkSecondary: '#405D70',
  inkMuted: '#526F80',
  surface: '#FFFFFF',
  surfaceAlt: '#F4FAFD',
  border: '#C7DFE7',
  disabledBg: '#E6EEF2',
  disabledText: '#587081',
  disabledBorder: '#D3E0E6',
};

const T = LIGHT_TONES;
// A tonal, outline or selected button is defined by its 1px edge as much as its
// fill, so those looks carry borderWidth. Solid, idle and disabled ones do not.
const variant = (backgroundColor, borderColor, color, outlined = true) => ({
  box: outlined ? { backgroundColor, borderColor, borderWidth: 1 } : { backgroundColor, borderColor },
  text: { color },
  icon: color,
});

// box   -> spread into the button container style
// text  -> spread into its label style
// icon  -> colour for a lucide icon inside it
export const LIGHT_ACTION = {
  solid: variant(T.primary, T.primaryDark, '#FFFFFF', false),
  tonal: variant(T.primarySoft, T.primaryBorder, T.primaryDark),
  neutral: variant(T.surface, T.border, T.ink),
  danger: variant(T.danger, T.dangerDark, '#FFFFFF', false),
  dangerTonal: variant(T.dangerSoft, T.dangerBorder, T.danger),
  selected: variant(T.warningSoft, T.warningBorder, T.warning),
  idle: variant('transparent', 'transparent', T.inkSecondary, false),
  disabled: variant(T.disabledBg, T.disabledBorder, T.disabledText, false),
};

// Track colours for a Switch: blue when on, a clearly visible grey-blue when off.
export const LIGHT_SWITCH = { false: '#9FB6C2', true: T.primary };

// The dark theme keeps each screen's own styles, so every slot is empty and
// call sites fall back to what they already render.
const empty = { box: undefined, text: undefined, icon: undefined };
export const DARK_ACTION = Object.fromEntries(Object.keys(LIGHT_ACTION).map(name => [name, empty]));

// Status badge colours: text, fill and border for pills and banners.
const badge = (color, backgroundColor, borderColor) => ({ color, backgroundColor, borderColor });
export const LIGHT_BADGE = {
  success: badge(T.success, T.successSoft, T.successBorder),
  warning: badge(T.warning, T.warningSoft, T.warningBorder),
  danger: badge(T.danger, T.dangerSoft, T.dangerBorder),
  info: badge(T.primaryDark, T.primarySoft, T.primaryBorder),
  neutral: badge(T.inkSecondary, '#EAF2F6', T.border),
};
