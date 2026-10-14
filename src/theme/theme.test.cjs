const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const { lightColor, adaptStyles } = new Function(source('legacyTheme.js').replaceAll('export function ', 'function ')+'\nreturn { lightColor, adaptStyles };')();

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
  assert.equal(lightColor('#EF4444'), '#C92B36');
  assert.equal(lightColor('#14B8A6','backgroundColor'), '#137B49');
  assert.equal(lightColor('transparent','backgroundColor'), 'transparent');
  assert.equal(lightColor(undefined), undefined);
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
