// Compatibility for the existing glass screens. Keep their layout and dark
// tokens intact while adapting presentation colors to the light palette.
//
// Light roles (same values as lightTones.js; theme.test.cjs keeps both in step):
//   blue  #0676A1  every solid action button, white text on it
//   sun   #FFF2B8 / #855700  selected tab, chip or toggle
//   green #0F6B3C  positive status text (fills #137B49)
//   red   #C0262F  destructive or critical
// Keep this file free of imports: the theme test loads it as plain source.
const textColors = {
  '#ffffff': '#09243B', '#fff': '#09243B', '#f8fafc': '#09243B',
  '#f5efe9': '#09243B', '#f7f3ee': '#09243B',
  // Near-black text only ever sits on a bright accent fill, and in light mode
  // those fills become blue, green or red, so the label flips to white.
  '#000000': '#FFFFFF', '#000': '#FFFFFF', '#121212': '#FFFFFF',
  '#f59e0b': '#855700', '#fbbf24': '#855700', '#f5b942': '#855700',
  '#ed8936': '#0676A1', '#f28c38': '#0676A1', '#f6ad55': '#0676A1',
  '#f97316': '#B4530A', '#fb923c': '#B4530A',
  '#14b8a6': '#0F6B3C', '#2dd4bf': '#0F6B3C', '#22c55e': '#0F6B3C',
  '#4ade80': '#0F6B3C', '#48bb78': '#0F6B3C',
  '#3b82f6': '#066FA2', '#60a5fa': '#066FA2', '#38bdf8': '#066FA2',
  '#ef4444': '#C0262F', '#f87171': '#C0262F', '#f56565': '#C0262F',
  '#94a3b8': '#526F80', '#64748b': '#526F80',
};
const solidFills = {
  '#14b8a6': '#137B49', '#2dd4bf': '#137B49', '#22c55e': '#137B49',
  '#4ade80': '#137B49', '#48bb78': '#137B49',
  '#f59e0b': '#0676A1', '#fbbf24': '#0676A1', '#ed8936': '#0676A1', '#f28c38': '#0676A1',
  '#3b82f6': '#0676A1', '#60a5fa': '#0676A1', '#38bdf8': '#0676A1',
  '#ef4444': '#C0262F', '#f56565': '#C0262F',
};
// Translucent accent fills turn into fixed pale tints so a label on top always
// has the same contrast, whatever page gradient sits underneath. Each tint
// keeps 4.5:1 with its family's text colour (#855700, #0F6B3C, #C0262F, #075471).
const tints = {
  amber: ['#FFFBEB', '#FFF5CC', '#FFEDAD', '#FFE58A'],
  red: ['#FEF5F6', '#FCE8EA', '#FADDE0', '#FADDE0'],
  green: ['#F1FAF4', '#E4F5EA', '#D3EEDD', '#C5EAD3'],
  blue: ['#F2FAFD', '#E4F4FA', '#DDF2FA', '#CBE9F5'],
};
const darkSurfaces = new Set(['#0b1020', '#0a0e27', '#050816', '#15110e', '#211b17', '#2a221d', '#121212', '#1e1e1e', '#26241f', '#0f172a', '#111827', '#1e293b', '#0b1120', '#000000', '#000']);

function tintFamily(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return null;
  const l = (max + min) / 510, s = d / (255 - Math.abs(max + min - 255));
  if (s < 0.35 || l < 0.12 || l > 0.9) return null;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 18 && h < 62) return 'amber';
  if (h >= 345 || h < 14) return 'red';
  if (h >= 85 && h < 195) return 'green';
  if (h >= 195 && h < 255) return 'blue';
  return null; // violet and pink stay as authored
}

// Coloured glows under buttons follow the fill colour they sit beneath.
const glowRecolors = [
  [/rgba\(\s*(?:245,\s*158,\s*11|251,\s*191,\s*36|237,\s*137,\s*54|249,\s*115,\s*22)\s*,/gi, 'rgba(6, 118, 161,'],
  [/rgba\(\s*(?:20,\s*184,\s*166|45,\s*212,\s*191|34,\s*197,\s*94)\s*,/gi, 'rgba(19, 123, 73,'],
  [/rgba\(\s*239,\s*68,\s*68\s*,/gi, 'rgba(192, 38, 47,'],
];

export function lightColor(value, property = 'color') {
  if (typeof value !== 'string') return value;
  if (property === 'boxShadow') return glowRecolors.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
  const key = value.toLowerCase().replace(/\s/g, '');
  if (property === 'shadowColor') return solidFills[key] || value;
  const foreground = ['color', 'fill', 'stroke', 'placeholderTextColor', 'tintColor'].includes(property);
  if (foreground && textColors[key]) return textColors[key];
  if (property === 'backgroundColor') {
    if (solidFills[key]) return solidFills[key];
    if (/^#[\da-f]{6}$/.test(key)) {
      const channels = [1,3,5].map(i => parseInt(key.slice(i,i+2),16));
      if (Math.max(...channels) < 65) return '#FFFFFF';
    }
  }
  const rgba = key.match(/^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/);
  if (rgba) {
    const [,r,g,b,a = '1'] = rgba;
    if (+r >= 240 && +g >= 230 && +b >= 220) {
      if (foreground) return +a < 0.5 ? '#526F80' : +a < 0.8 ? '#405D70' : '#09243B';
      if (/border/i.test(property)) return '#C7DFE7';
      return +a <= 0.06 ? '#F4FAFD' : '#FFFFFF';
    }
    if (+r < 30 && +g < 35 && +b < 65 && property === 'backgroundColor') {
      return +a >= 0.8 ? '#FFFFFF' : '#F0F9FF';
    }
    if (property === 'backgroundColor' && +a < 0.9) {
      const family = tintFamily(+r, +g, +b);
      if (family) return tints[family][+a <= 0.07 ? 0 : +a <= 0.16 ? 1 : +a <= 0.28 ? 2 : 3];
    }
  }
  if (darkSurfaces.has(key) && property === 'backgroundColor') return '#F0F9FF';
  return value;
}

export function adaptStyles(styles) {
  const result = {};
  for (const [name, style] of Object.entries(styles)) {
    const keepWhite = /(?:button|btn|cta|confirm|submit|approve|reject|action|export|share|save|logout|hero|avatar).*(?:text|label|title|name|email|initial)/i.test(name);
    result[name] = {};
    for (const [property, value] of Object.entries(style)) {
      if (property === 'backgroundColor' && /scrim|backdrop|modalOverlay|modalBg/i.test(name)) {
        result[name][property] = 'rgba(9, 36, 59, 0.45)';
      } else {
        result[name][property] = keepWhite && property === 'color' && /^#(?:fff|ffffff)$/i.test(value)
          ? value : lightColor(value, property);
      }
    }
  }
  return result;
}
