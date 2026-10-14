// Compatibility for the existing glass screens. Keep their layout and dark
// tokens intact while adapting presentation colors to the light palette.
const textColors = {
  '#ffffff': '#09243B', '#fff': '#09243B', '#f8fafc': '#09243B',
  '#f5efe9': '#09243B', '#f7f3ee': '#09243B',
  '#f59e0b': '#936000', '#fbbf24': '#936000', '#f5b942': '#936000',
  '#ed8936': '#0676A1', '#f28c38': '#0676A1', '#f6ad55': '#0676A1',
  '#14b8a6': '#137B49', '#2dd4bf': '#137B49', '#22c55e': '#167744',
  '#4ade80': '#167744', '#48bb78': '#167744',
  '#3b82f6': '#066FA2', '#60a5fa': '#066FA2', '#38bdf8': '#066FA2',
  '#ef4444': '#C92B36', '#f87171': '#C92B36', '#f56565': '#C92B36',
  '#94a3b8': '#526F80', '#64748b': '#526F80',
};
const darkSurfaces = new Set(['#0b1020', '#0a0e27', '#050816', '#15110e', '#211b17', '#2a221d', '#121212', '#1e1e1e', '#26241f', '#0f172a', '#111827', '#1e293b', '#0b1120', '#000000', '#000']);
export function lightColor(value, property = 'color') {
  if (typeof value !== 'string') return value;
  const key = value.toLowerCase().replace(/\s/g, '');
  const foreground = ['color', 'fill', 'stroke', 'placeholderTextColor', 'tintColor'].includes(property);
  if (foreground && textColors[key]) return textColors[key];
  if (property === 'backgroundColor') {
    if (['#14b8a6', '#22c55e', '#48bb78'].includes(key)) return '#137B49';
    if (['#f59e0b', '#fbbf24', '#ed8936', '#f28c38'].includes(key)) return '#0676A1';
    if (['#ef4444', '#f56565'].includes(key)) return '#C92B36';
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
