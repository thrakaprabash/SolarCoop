// Regression checks for the component audit. Shared report navigation remains pending.
// Run explicitly with: node --test src/trade/audit/component-audit.test.cjs
// No network calls, real credentials, or live database writes are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
function source(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\r?\n/gm, '')
    .replace(/export default function /g, 'function ')
    .replace(/export (async )?function /g, '$1function ')
    .replace(/export const /g, 'const ');
}
function load(relative, names, dependencies = {}) {
  return new Function(...Object.keys(dependencies), `${source(relative)}\nreturn {${names.join(',')}};`)(...Object.values(dependencies));
}
const format = load('utils/format.js', ['tradeKwh', 'decimalAmount', 'addTradeAmounts', 'stamp']);
const { reportingHelp } = load('utils/reportingHelp.js', ['reportingHelp']);

// Run the real screen callbacks with deterministic hooks and inert UI elements.
// This tests screen logic; it does not claim native/browser layout coverage.
function screenHarness(relative, name, overrides = {}) {
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
  const hooks = {
    React,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useMemo: fn => fn(),
    useEffect(fn, deps) {
      const i = cursor++;
      if (!(i in slots) || deps.some((d, j) => d !== slots[i][j])) pendingEffects.push(fn);
      slots[i] = deps;
    },
  };
  const ui = Object.fromEntries([
    'Pressable', 'ScrollView', 'Text', 'TextInput', 'View', 'ArrowUpRight', 'Home', 'Minus', 'Plus',
    'ActivityIndicator', 'ArrowDown', 'ArrowUp', 'ChevronRight', 'Check', 'X', 'Card', 'Divider', 'IconBadge',
    'Metric', 'Notice', 'PrimaryButton', 'ScreenTitle', 'DetailRow', 'EmptyState', 'Pill', 'SectionLabel',
  ].map(name => [name, name]));
  const deps = {
    ...hooks, ...ui, StyleSheet: { create: x => x }, colors: {}, radius: {}, weight: {},
    kwh: format.tradeKwh, decimalAmount: format.decimalAmount, addTradeAmounts: format.addTradeAmounts, reportingHelp,
    money: n => '$' + Number(n).toFixed(2), fmtRate: n => Number(n).toFixed(2),
    stamp: d => d.toISOString(),
    useTranslation: () => ({ t: (key, values) => values ? `${key} ${JSON.stringify(values)}` : key, i18n: { language: 'en' } }),
    ...overrides,
  };
  const transformed = babel.transformSync(source(relative), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'],
  }).code;
  const screen = new Function(...Object.keys(deps), `${transformed}\nreturn ${name};`)(...Object.values(deps));
  return {
    render(props = {}) { cursor = 0; return screen(props); },
    effects() { const queued = pendingEffects; pendingEffects = []; queued.forEach(fn => fn()); },
  };
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function requestScreen(balance, submitRequest = async () => ({ error: null })) {
  const provider = { id: 'provider', name: 'Test Provider', kwh: balance, rate: 0.22 };
  return screenHarness('screens/EnergyRequestScreen.js', 'EnergyRequestScreen', {
    useTrade: () => ({ getHousehold: () => provider, refreshProviders: () => {}, submitRequest, showToast: () => {} }),
    useNavigation: () => ({ params: { providerId: provider.id } }),
  });
}

test('A01: the amount stepper must stay within a fractional provider balance', () => {
  const failures = [];
  for (const balance of [0.25, 0.04, 1.25]) {
    const h = requestScreen(balance);
    const minus = nodes(h.render(), n => n.type?.name === 'Stepper')[0];
    minus.props.onPress();
    const displayed = Number(nodes(h.render(), n => n.type === 'TextInput')[0].props.value);
    if (!(displayed > 0 && displayed <= balance)) failures.push(`balance=${balance}, stepper produced ${displayed}`);
  }
  assert.deepEqual(failures, [], `Expected 0 < amount <= balance: ${failures.join('; ')}`);
});

test('A02: changing the form during submission must not attach an old confirmation to a new amount', async () => {
  let finish;
  const saved = [];
  const h = requestScreen(10, async (_provider, amount) => {
    saved.push(amount);
    return new Promise(resolve => { finish = resolve; });
  });
  const pending = nodes(h.render(), n => n.type === 'PrimaryButton')[0].props.onPress();
  const input = nodes(h.render(), n => n.type === 'TextInput')[0];
  assert.equal(input.props.editable, false);
  // Even an event queued before the disabled render must be ignored.
  input.props.onChangeText('1.0');
  const steppers = nodes(h.render(), n => n.type?.name === 'Stepper');
  assert.ok(steppers.every(n => n.props.disabled));
  steppers[0].props.onPress();
  if (input.props.editable !== false) input.props.onChangeText('1.0');
  finish({ error: null });
  await pending;
  const tree = h.render();
  const amount = Number(nodes(tree, n => n.type === 'TextInput')[0].props.value);
  const confirmation = nodes(tree, n => n.type === 'Notice' && n.props.tone === 'success')[0].props.message;
  assert.ok(amount === saved[0] || !confirmation,
    `saved ${saved[0]} kWh but input shows ${amount} with confirmation: ${confirmation}`);
});

// Evaluate the PostgREST logic used by the real service, including cursor filters.
function splitLogic(text) {
  let depth = 0, start = 0;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (text[i] === ',' && !depth) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  return [...parts, text.slice(start)];
}
function matchesLogic(row, expression) {
  const logical = /^(and|or)\((.*)\)$/.exec(expression);
  if (logical) {
    const values = splitLogic(logical[2]).map(part => matchesLogic(row, part));
    return logical[1] === 'and' ? values.every(Boolean) : values.some(Boolean);
  }
  const [, field, op, value] = /^(\w+)\.(eq|lt)\.(.+)$/.exec(expression) || [];
  assert.ok(field, `Unsupported filter: ${expression}`);
  if (op === 'eq') return String(row[field]) === value;
  return field === 'id' && /^\d+$/.test(value) ? BigInt(row[field]) < BigInt(value) : row[field] < value;
}
function cappedClient(tableRows, cap, beforeRead = () => {}) {
  const calls = [];
  return { from(table) {
    let start = 0, end = cap - 1;
    const filters = [], orders = [];
    const call = { table, ids: [] }; calls.push(call);
    const query = {
      select() { return this; },
      eq(field, value) { filters.push(row => row[field] === value); return this; },
      or(expression) { filters.push(row => matchesLogic(row, `or(${expression})`)); return this; },
      order(field, { ascending }) { orders.push([field, ascending]); return this; },
      in(field, values) { call.ids = values; filters.push(row => values.includes(row[field])); return this; },
      range(a, b) { start = a; end = Math.min(b, a + cap - 1); return this; },
      then(resolve, reject) {
        beforeRead(table, tableRows);
        const data = (tableRows[table] || []).filter(row => filters.every(filter => filter(row))).sort((a, b) => {
          for (const [field, ascending] of orders) {
            const x = field === 'id' && /^\d+$/.test(String(a[field])) ? BigInt(a[field]) : a[field];
            const y = field === 'id' && /^\d+$/.test(String(b[field])) ? BigInt(b[field]) : b[field];
            if (x !== y) return (x < y ? -1 : 1) * (ascending ? 1 : -1);
          }
          return 0;
        }).slice(start, end + 1);
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      },
    };
    return query;
  }, calls };
}
test('A03: My Requests and Incoming Requests must read beyond the API row cap', async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ id: i + 1, requester_id: 'requester', provider_id: 'provider',
    amount_requested_kwh: 0.5, status: 'PENDING', created_at: '2026-10-11T01:00:00Z' }));
  const services = load('services/requestService.js', ['fetchMyRequests', 'fetchIncomingRequests'], {
    supabase: cappedClient({ energy_requests: rows, profiles: [] }, 1000),
  });
  const result = [await services.fetchMyRequests('requester'), await services.fetchIncomingRequests('provider')];
  assert.deepEqual(result.map(rows => rows.length), [1001, 1001]);
});

test('A04: a new trade between history pages must not duplicate an existing trade', async () => {
  const transaction = id => ({ id, sender_id: 'provider', receiver_id: 'requester', request_id: id,
    reference_code: `TXN-${id}`, energy_amount: 1, status: 'COMPLETED', created_at: '2026-10-11T01:00:00Z' });
  let page = 0;
  const supabase = cappedClient({ transactions: Array.from({ length: 501 }, (_, i) => transaction(501 - i)), profiles: [] }, 1000,
    (table, data) => { if (table === 'transactions' && page++ === 1) data.transactions.unshift(transaction(502)); });
  const { fetchMyTransactions } = load('services/transactionService.js', ['fetchMyTransactions'], { supabase });
  const rows = await fetchMyTransactions('provider');
  assert.equal(rows.length, new Set(rows.map(row => row.id)).size,
    `${rows.length} rendered rows for ${new Set(rows.map(row => row.id)).size} distinct trades; totals are inflated`);
  assert.equal(rows.length, 501, 'Every original trade must be preserved');
  assert.equal(rows.at(-1).id, 1, 'Oldest original trade must still be present');
});

test('A05: history and Impact must agree on the Asia/Colombo reporting month', () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = 'UTC';
  try {
    const { monthLabel } = load('utils/format.js', ['monthLabel']);
    const { monthTotals } = load('utils/transactions.js', ['monthTotals'], { monthLabel, addTradeAmounts: format.addTradeAmounts });
    const { reportingPeriod } = load('services/energyAnalyticsService.js', ['reportingPeriod'], { supabase: {} });
    const now = new Date('2026-10-01T00:00:00Z');
    const trade = { status: 'COMPLETED', ts: '2026-09-30T19:00:00Z', dir: 'sent', kwh: 0.5 };
    const period = reportingPeriod(now);
    assert.ok(trade.ts >= period.start && trade.ts <= period.end);
    assert.equal(monthTotals([trade], now).sent, 0.5,
      'Impact includes the October 1 Colombo trade, but history excludes it on a UTC device');
  } finally {
    if (previousTZ === undefined) delete process.env.TZ; else process.env.TZ = previousTZ;
  }
});

test('A06: the newest daily snapshot must preserve PostgreSQL microsecond timestamp ordering', () => {
  const { normalizeDailyReadings } = load('utils/dailyEnergyReadings.js', ['normalizeDailyReadings']);
  const rows = [
    { id: '11', recorded_at: '2026-10-11T12:00:00.000100Z', production_kwh: 1, consumption_kwh: 0.5 },
    { id: '10', recorded_at: '2026-10-11T12:00:00.000900Z', production_kwh: 2, consumption_kwh: 1 },
  ];
  assert.equal(normalizeDailyReadings(rows)[0].production, 2,
    'Date.parse collapses the two timestamps to one millisecond and incorrectly uses the larger ID');
});

test('A07: direct complaint navigation', { skip: 'User requires all edits inside src/trade; shared Alerts integration is not approved.' }, () => {});

test('A07 mitigation: details gives reporting instructions without a false success toast', async () => {
  const navigation = [];
  const messages = [];
  const h = screenHarness('screens/TransactionDetailsScreen.js', 'TransactionDetailsScreen', {
    useTrade: () => ({ showToast: message => messages.push(message) }),
    useNavigation: () => ({ params: { txnId: 'test', source: 'history' }, navigate: (...args) => navigation.push(args) }),
    useAuth: () => ({ user: { id: 'requester' } }),
    fetchTransactionById: async () => ({ id: 'test', dir: 'received', status: 'COMPLETED', kwh: 0.5,
      ts: '2026-10-11T01:00:00Z', sender: 'Provider', ref: 'TXN-TEST' }),
    fetchTransactionByRequestId: async () => null,
  });
  h.render(); h.effects();
  await new Promise(resolve => setImmediate(resolve));
  const tree = h.render();
  assert.ok(nodes(tree, n => n.type === 'Text' && n.props.children.includes(reportingHelp('en'))).length);
  assert.equal(messages.length, 0);
  assert.equal(navigation.length, 0);
});

test('A08: transaction dates must follow the selected Sinhala language', () => {
  const { clock, kwh, shortDate } = load('utils/format.js', ['clock', 'kwh', 'shortDate']);
  const h = screenHarness('components/TransactionCard.js', 'TransactionCard', {
    clock, kwh, shortDate,
    useTranslation: () => ({ t: key => key, i18n: { language: 'si', resolvedLanguage: 'si' } }),
  });
  const timestamp = '2026-10-11T01:00:00Z';
  const tree = h.render({ transaction: { dir: 'received', ts: timestamp, kwh: 0.5, status: 'COMPLETED' } });
  const text = nodes(tree, n => n.type === 'Text').flatMap(n => n.props.children).join(' ');
  const expectedDate = new Date(timestamp).toLocaleDateString('si-LK', { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short' });
  assert.ok(text.includes(expectedDate), `Expected Sinhala date ${expectedDate}; rendered: ${text}`);
});

test('A09: a disabled primary action must expose its button role and disabled state', () => {
  const h = screenHarness('components/ui/PrimaryButton.js', 'PrimaryButton');
  const tree = h.render({ label: 'Submit Request', disabled: true, onPress: () => {} });
  const pressable = nodes(tree, n => n.type === 'Pressable')[0];
  assert.equal(pressable.props.accessibilityRole, 'button');
  assert.ok(pressable.props.disabled === true || pressable.props.accessibilityState?.disabled === true,
    'Removing onPress alone does not announce disabled state to assistive technology');
});

test('A01: decimal arithmetic preserves small balances, exact subtraction and repeated steps', () => {
  assert.equal(format.addTradeAmounts(0.25, -0.2), 0.05);
  assert.equal(format.addTradeAmounts(0.1, 0.2), 0.3);
  assert.equal(format.decimalAmount(-1e-7), '-0.0000001');
  assert.equal(format.tradeKwh(0.04), '0.04');
  const h = requestScreen(10);
  nodes(h.render(), n => n.type === 'TextInput')[0].props.onChangeText('0.123');
  for (let i = 0; i < 3; i++) nodes(h.render(), n => n.type?.name === 'Stepper')[1].props.onPress();
  assert.equal(nodes(h.render(), n => n.type === 'TextInput')[0].props.value, '1.623');
});

test('A03/A04: profile lookups are bounded and preserve names beyond the first batch', async () => {
  const profiles = Array.from({ length: 251 }, (_, i) => ({ id: `member-${i}`, name: `Member ${i}` }));
  const requests = profiles.map((profile, i) => ({ id: i + 1, requester_id: 'requester', provider_id: profile.id,
    amount_requested_kwh: 0.5, status: 'PENDING', created_at: '2026-10-11T01:00:00Z' }));
  const transactions = profiles.map((profile, i) => ({ id: i + 1, sender_id: 'requester', receiver_id: profile.id,
    energy_amount: 0.5, status: 'COMPLETED', created_at: '2026-10-11T01:00:00Z' }));
  const supabase = cappedClient({ profiles, energy_requests: requests, transactions }, 1000);
  const requestService = load('services/requestService.js', ['fetchMyRequests'], { supabase });
  const transactionService = load('services/transactionService.js', ['fetchMyTransactions'], { supabase });
  assert.equal((await requestService.fetchMyRequests('requester')).find(row => row.providerId === 'member-250').name, 'Member 250');
  assert.equal((await transactionService.fetchMyTransactions('requester')).find(row => row.receiverId === 'member-250').party, 'Member 250');
  assert.ok(supabase.calls.filter(call => call.table === 'profiles').every(call => call.ids.length <= 100));
  assert.equal(supabase.calls.filter(call => call.table === 'profiles').length, 6);
});

test('A05/A08: month groups, totals and translated dates use Colombo across a UTC month boundary', () => {
  const { monthLabel, longDate, clock } = load('utils/format.js', ['monthLabel', 'longDate', 'clock']);
  const { monthTotals, groupByMonth } = load('utils/transactions.js', ['monthTotals', 'groupByMonth'], {
    monthLabel, addTradeAmounts: format.addTradeAmounts,
  });
  const rows = [0.1, 0.2].map(kwh => ({ ts: '2026-09-30T19:00:00Z', status: 'COMPLETED', dir: 'sent', kwh }));
  assert.equal(monthTotals(rows, new Date('2026-10-01T00:00:00Z')).sent, 0.3);
  assert.equal(groupByMonth(rows, 'en')[0].label, 'October 2026');
  for (const [language, locale] of [['en', 'en-GB'], ['si', 'si-LK'], ['ta', 'ta-LK']]) {
    const date = new Date(rows[0].ts);
    assert.equal(longDate(date, language), date.toLocaleDateString(locale, { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric' }));
    assert.equal(clock(date, language), date.toLocaleTimeString(locale, { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' }));
  }
});

test('A06: microsecond order is independent of timestamp timezone and row order', () => {
  const { normalizeDailyReadings } = load('utils/dailyEnergyReadings.js', ['normalizeDailyReadings']);
  const rows = [
    { id: '90', recorded_at: '2026-10-11T17:30:00.000100+05:30', production_kwh: 1, consumption_kwh: 1 },
    { id: '10', recorded_at: '2026-10-11T12:00:00.000900Z', production_kwh: 2, consumption_kwh: 1 },
  ];
  for (const input of [rows, [...rows].reverse()]) assert.equal(normalizeDailyReadings(input)[0].production, 2);
});
