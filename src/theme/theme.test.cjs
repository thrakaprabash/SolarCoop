const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const { lightColor, adaptStyles } = new Function(source('legacyTheme.js').replaceAll('export function ', 'function ')+'\nreturn { lightColor, adaptStyles };')();
const { LIGHT_TONES, LIGHT_ACTION, DARK_ACTION, LIGHT_BADGE, LIGHT_SWITCH } = new Function(source('lightTones.js').replaceAll('export const ', 'const ')+'\nreturn { LIGHT_TONES, LIGHT_ACTION, DARK_ACTION, LIGHT_BADGE, LIGHT_SWITCH };')();

test('light surfaces and text remain distinct without changing layout or source styles', () => {
  const original = { card: { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', padding: 16, borderRadius: 24 }, title: { color: '#FFFFFF' }, modalSheet: { backgroundColor: '#111737' }, confirmLabel: { color: '#FFFFFF' }, scrim: { backgroundColor: 'rgba(5,8,22,0.7)' } };
  const snapshot = JSON.stringify(original);
  const light = adaptStyles(original);
  assert.equal(light.card.backgroundColor, '#FFFFFF');
  assert.equal(light.card.borderColor, '#C7DFE7');
  assert.equal(light.title.color, '#09243B');
  assert.equal(light.modalSheet.backgroundColor, '#FFFFFF');
  assert.equal(light.confirmLabel.color, '#FFFFFF');
  assert.equal(light.scrim.backgroundColor, 'rgba(9, 36, 59, 0.45)');
  assert.equal(light.card.padding, 16);
  assert.equal(light.card.borderRadius, 24);
  assert.equal(JSON.stringify(original), snapshot);
});
test('light status and form colors remain readable and preserve transparent values', () => {
  assert.equal(lightColor('rgba(255, 255, 255, 0.35)'), '#526F80');
  assert.equal(lightColor('#EF4444'), '#C0262F');
  assert.equal(lightColor('#14B8A6','backgroundColor'), '#137B49');
  assert.equal(lightColor('transparent','backgroundColor'), 'transparent');
  assert.equal(lightColor(undefined), undefined);
});

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}
test('light button and navigation color pairs meet WCAG AA normal-text contrast', () => {
  const pairs = [
    ['FFFFFF', '0676A1'], // primary
    ['FFFFFF', '137B49'], // green fill
    ['FFFFFF', 'C0262F'], // destructive
    ['0F6B3C', 'DCF3E4'], // green status / requested
    ['855700', 'FFF2B8'], // sun selected navigation
    ['526F80', 'F0F9FF'], // inactive navigation
    ['075471', 'DDF2FA'], // selected appearance control
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background} must be at least 4.5:1`);
  }
});

const pageBackground = '#F0F9FF';
const hexOf = value => (value === 'transparent' ? pageBackground : value).replace('#', '');
test('every shared light button look keeps its label readable', () => {
  for (const [name, look] of Object.entries(LIGHT_ACTION)) {
    const ratio = contrast(hexOf(look.text.color), hexOf(look.box.backgroundColor));
    // A disabled control is exempt from WCAG, but we still keep it above 4:1.
    assert.ok(ratio >= (name === 'disabled' ? 4 : 4.5), `${name} button ${look.text.color} on ${look.box.backgroundColor} is ${ratio.toFixed(2)}:1`);
    assert.equal(look.icon, look.text.color, `${name} icon matches its label`);
  }
  for (const [name, badge] of Object.entries(LIGHT_BADGE)) {
    const ratio = contrast(hexOf(badge.color), hexOf(badge.backgroundColor));
    assert.ok(ratio >= 4.5, `${name} badge ${badge.color} on ${badge.backgroundColor} is ${ratio.toFixed(2)}:1`);
  }
});
test('a light switch is visibly different on and off, and white thumbs stay distinct from both tracks', () => {
  assert.equal(LIGHT_SWITCH.true, LIGHT_TONES.primary);
  // 3:1 is the WCAG minimum for a control against the surface it sits on.
  assert.ok(contrast(hexOf(LIGHT_SWITCH.true), 'FFFFFF') >= 3);
  assert.ok(contrast(hexOf(LIGHT_SWITCH.false), 'FFFFFF') >= 2, 'off track vs white thumb');
  assert.ok(contrast(hexOf(LIGHT_SWITCH.false), hexOf(LIGHT_SWITCH.true)) >= 1.5, 'off and on tracks differ');
});
test('dark theme leaves every button slot empty so screens keep their own styling', () => {
  assert.deepEqual(Object.keys(DARK_ACTION), Object.keys(LIGHT_ACTION));
  for (const look of Object.values(DARK_ACTION)) assert.deepEqual(look, { box: undefined, text: undefined, icon: undefined });
});
test('the legacy adapter uses the same palette as the shared tones', () => {
  assert.equal(lightColor('#F59E0B', 'backgroundColor'), LIGHT_TONES.primary);
  assert.equal(lightColor('#3B82F6', 'backgroundColor'), LIGHT_TONES.primary);
  assert.equal(lightColor('#EF4444', 'backgroundColor'), LIGHT_TONES.danger);
  assert.equal(lightColor('#2DD4BF', 'backgroundColor'), LIGHT_TONES.successFill);
  assert.equal(lightColor('#2DD4BF'), LIGHT_TONES.success);
  assert.equal(lightColor('#FBBF24'), LIGHT_TONES.warning);
  assert.equal(lightColor('#EF4444'), LIGHT_TONES.danger);
  // high-severity orange text stays readable on its pale amber tint
  assert.equal(lightColor('#FB923C'), '#B4530A');
  assert.ok(contrast('B4530A', hexOf(lightColor('rgba(249,115,22,0.12)', 'backgroundColor'))) >= 4.5);
});
test('translucent accent fills become fixed tints that stay readable under their text colour', () => {
  const families = {
    amber: { text: LIGHT_TONES.warning, fills: ['rgba(245,158,11,0.08)', 'rgba(251,191,36,0.12)', 'rgba(245,158,11,0.2)', 'rgba(245, 158, 11, 0.35)', 'rgba(249,115,22,0.12)'] },
    red: { text: LIGHT_TONES.danger, fills: ['rgba(239,68,68,0.05)', 'rgba(239,68,68,0.12)', 'rgba(239,68,68,0.2)', 'rgba(239, 68, 68, 0.3)'] },
    green: { text: LIGHT_TONES.success, fills: ['rgba(20,184,166,0.08)', 'rgba(45,212,191,0.12)', 'rgba(34,197,94,0.2)', 'rgba(20, 184, 166, 0.3)'] },
    blue: { text: LIGHT_TONES.primaryDark, fills: ['rgba(59,130,246,0.12)', 'rgba(96,165,250,0.2)', 'rgba(56,189,248,0.3)'] },
  };
  for (const [family, { text, fills }] of Object.entries(families)) {
    for (const fill of fills) {
      const tint = lightColor(fill, 'backgroundColor');
      assert.match(tint, /^#[\dA-F]{6}$/, `${fill} should resolve to a solid tint`);
      assert.ok(contrast(hexOf(text), hexOf(tint)) >= 4.5, `${family} text on ${tint} (from ${fill}) must be at least 4.5:1`);
    }
  }
  // borders, violet, pink, near-solid and translucent white keep their previous handling
  assert.equal(lightColor('rgba(245,158,11,0.3)', 'borderColor'), 'rgba(245,158,11,0.3)');
  assert.equal(lightColor('rgba(139,92,246,0.12)', 'backgroundColor'), 'rgba(139,92,246,0.12)');
  assert.equal(lightColor('rgba(236,72,153,0.12)', 'backgroundColor'), 'rgba(236,72,153,0.12)');
  assert.equal(lightColor('rgba(245,158,11,0.95)', 'backgroundColor'), 'rgba(245,158,11,0.95)');
  assert.equal(lightColor('rgba(255,255,255,0.07)', 'backgroundColor'), '#FFFFFF');
});
test('coloured button glows follow the fill colour they sit under', () => {
  assert.equal(lightColor('0px 4px 16px rgba(245, 158, 11, 0.4)', 'boxShadow'), '0px 4px 16px rgba(6, 118, 161, 0.4)');
  assert.match(lightColor('0px 4px 16px rgba(239,68,68,0.3)', 'boxShadow'), /^0px 4px 16px rgba\(192, 38, 47,\s*0\.3\)$/);
  assert.equal(lightColor('0px 8px 24px rgba(0, 0, 0, 0.15)', 'boxShadow'), '0px 8px 24px rgba(0, 0, 0, 0.15)');
  assert.equal(lightColor('#F59E0B', 'shadowColor'), LIGHT_TONES.primary);
  assert.equal(lightColor('#000', 'shadowColor'), '#000');
});
test('black labels that sit on bright accent fills flip to white with the fill', () => {
  for (const black of ['#000', '#000000', '#121212']) assert.equal(lightColor(black, 'color'), '#FFFFFF');
  assert.equal(lightColor('#000000', 'shadowColor'), '#000000');
  assert.equal(lightColor('#000000', 'backgroundColor'), '#FFFFFF');
});

function harness(saved, scheme = 'light') {
  const slots = [], effects = []; let cursor = 0, system = scheme; const writes = [];
  let resolveRead;
  const storage = { getItem: () => new Promise(resolve => { resolveRead = resolve; }), setItem: async (key,value) => writes.push([key,value]) };
  const hooks = {
    createContext: () => ({}), useColorScheme: () => system,
    useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i], value => slots[i]=typeof value==='function'?value(slots[i]):value]; },
    useRef(initial) { const i=cursor++; if (!(i in slots)) slots[i]={current:initial}; return slots[i]; },
    useEffect(fn) { const i=cursor++; if (!(i in slots)) { slots[i]=true; effects.push(fn); } },
    useMemo: fn => fn(), useCallback: fn => fn,
    AsyncStorage: storage, getTheme: mode => ({ mode, isDark: mode === 'dark' }),
  };
  const code = source('ThemeProvider.js').replace(/^import .*;\r?\n/gm,'').replaceAll('export const ', 'const ').replaceAll('export function ', 'function ').replace('return <ThemeContext.Provider value={value}>{ready ? children : null}</ThemeContext.Provider>;', 'return value;');
  const Provider = new Function(...Object.keys(hooks),code+'\nreturn ThemeProvider;')(...Object.values(hooks));
  const render = () => { cursor=0; return Provider({ children:null }); };
  render(); effects.forEach(fn => fn());
  return { render, writes, async restore() { resolveRead(saved); await new Promise(resolve => setImmediate(resolve)); }, setSystem(value) { system=value; } };
}
test('default preserves dark mode; saved choice restores and system mode follows device', async () => {
  const h = harness('light');
  assert.equal(h.render().mode, 'dark');
  assert.equal(h.render().ready, false);
  await h.restore();
  assert.equal(h.render().mode, 'light');
  assert.equal(h.render().ready, true);
  h.render().setPreference('system');
  h.setSystem('dark');
  assert.equal(h.render().mode, 'dark');
  h.setSystem('light');
  assert.equal(h.render().mode, 'light');
});
test('new selection wins over pending restore; latest valid choice persists last', async () => {
  const h = harness('light');
  h.render().setPreference('dark');
  await h.restore();
  assert.equal(h.render().mode, 'dark');
  h.render().setPreference('light');
  h.render().setPreference('dark');
  h.render().setPreference('invalid');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.writes.map(row=>row[1]), ['dark','light','dark']);
  assert.equal(h.render().preference, 'dark');
});
test('invalid saved values fall back to the existing dark appearance', async () => {
  const h = harness('unknown'); await h.restore(); assert.equal(h.render().mode,'dark');
});
test('portal override preserves its own appearance controls and falls back to the shared preference', () => {
  const global = { mode: 'dark', preference: 'dark', setPreference: () => {}, colors: { text: 'global' } };
  const ThemeContext = {}, ThemeOverrideContext = {};
  let override = null;
  const code = source('useTheme.js').replace(/^import .*;\r?\n/gm,'').replaceAll('export const ', 'const ');
  const useTheme = new Function('useContext','ThemeContext','ThemeOverrideContext',code+'\nreturn useTheme;')(
    context => context === ThemeContext ? global : override, ThemeContext, ThemeOverrideContext);
  assert.equal(useTheme(), global);
  const setPreference = () => {};
  override = { mode: 'light', preference: 'system', setPreference, colors: { text: 'portal' } };
  assert.equal(useTheme().mode, 'light');
  assert.equal(useTheme().preference, 'system');
  assert.equal(useTheme().setPreference, setPreference);
  assert.equal(useTheme().colors.text, 'portal');
});
