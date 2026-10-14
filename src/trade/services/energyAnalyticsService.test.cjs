const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function harness(responses = []) {
  const calls = [];
  const supabase = { from(table) {
    const call = { table, filters: [], orders: [] }; calls.push(call);
    const q = {
      select(columns) { call.columns = columns; return q; },
      eq(key, value) { call.filters.push(['eq', key, value]); return q; },
      gte(key, value) { call.filters.push(['gte', key, value]); return q; },
      lte(key, value) { call.filters.push(['lte', key, value]); return q; },
      order(key, options) { call.orders.push([key, options]); return q; },
      range(a, b) { call.range = [a, b]; return q; },
      limit(value) { call.limit = value; return q; },
      maybeSingle() { return Promise.resolve(responses.shift()); },
      then(resolve, reject) { return Promise.resolve(responses.shift()).then(resolve, reject); },
    }; return q;
  } };
  const source = fs.readFileSync(path.join(__dirname, 'energyAnalyticsService.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replaceAll('export async function ', 'async function ')
    .replaceAll('export function ', 'function ');
  const service = new Function('supabase', `${source}\nreturn { reportingPeriod, fetchLatestEnergyReading, fetchAnalyticsReadings, fetchSharedEnergy };`)(supabase);
  return { ...service, calls };
}
const period = { start: '2026-09-30T18:30:00.000Z', end: '2026-10-03T12:00:00.000Z' };
const row = (id, amount = '0.5') => ({ id, sender_id: 'member', status: 'COMPLETED',
  energy_amount: amount, created_at: '2026-10-01T00:00:00Z' });

test('Colombo month starts at local midnight across the UTC month boundary', () => {
  const result = harness().reportingPeriod(new Date('2026-09-30T19:00:00Z'));
  assert.equal(result.day, '2026-10-01');
  assert.equal(result.start, '2026-09-30T18:30:00.000Z');
});
test('latest reading is scoped and ordered without treating it as a daily total', async () => {
  const reading = { id: 1, user_id: 'member', production_kwh: '6.1', recorded_at: '2026-08-26T10:34:28Z' };
  const h = harness([{ data: reading, error: null }]);
  assert.deepEqual(await h.fetchLatestEnergyReading('member'), reading);
  assert.deepEqual(h.calls[0].filters, [['eq', 'user_id', 'member']]);
  assert.equal(h.calls[0].limit, 1);
  assert.deepEqual(h.calls[0].orders.map(([key]) => key), ['recorded_at', 'id']);
});
test('signed-out and no-record states remain distinct from failed energy reads', async () => {
  const h = harness([{ data: null, error: null }, { error: new Error('offline') }]);
  assert.equal(await h.fetchLatestEnergyReading(null), null);
  assert.equal(h.calls.length, 0);
  assert.equal(await h.fetchLatestEnergyReading('member'), null);
  await assert.rejects(h.fetchLatestEnergyReading('member'), /offline/);
});
test('shared totals read every page and filter completed outgoing month-to-date trades', async () => {
  const h = harness([{ data: Array.from({ length: 500 }, (_, i) => row(i)), error: null },
    { data: [row(500, '1')], error: null }]);
  assert.equal(await h.fetchSharedEnergy('member', period), 251);
  assert.deepEqual(h.calls[0].filters, [['eq', 'sender_id', 'member'], ['eq', 'status', 'COMPLETED'],
    ['gte', 'created_at', period.start], ['lte', 'created_at', period.end]]);
  assert.deepEqual(h.calls[1].range, [500, 999]);
});
test('empty ledger is genuine zero; later-page failure never returns a partial total', async () => {
  const h = harness([{ data: [], error: null },
    { data: Array.from({ length: 500 }, (_, i) => row(i)), error: null }, { error: new Error('offline') }]);
  assert.equal(await h.fetchSharedEnergy('member', period), 0);
  await assert.rejects(h.fetchSharedEnergy('member', period), /offline/);
});
test('invalid amounts, dates, reversed and received rows cannot masquerade as valid totals', async () => {
  for (const invalid of [null, '', 'NaN', -1, Infinity]) {
    const h = harness([{ data: [row(1, invalid)], error: null }]);
    await assert.rejects(h.fetchSharedEnergy('member', period), /verified/);
  }
  for (const patch of [{ sender_id: 'other' }, { status: 'REVERSED' }, { created_at: 'invalid' },
    { created_at: '2026-09-01T00:00:00Z' }, { created_at: '2026-11-01T00:00:00Z' }]) {
    const h = harness([{ data: [{ ...row(1), ...patch }], error: null }]);
    await assert.rejects(h.fetchSharedEnergy('member', period), /verified/);
  }
});

test('energy history spans seven completed days across a month boundary and reads every page', async () => {
  const p = harness().reportingPeriod(new Date('2026-10-04T06:00:00Z'));
  const reading = (id) => ({ id, user_id: 'member', recorded_at: '2026-09-30T18:30:00Z' });
  const h = harness([{ data: Array.from({ length: 500 }, (_, i) => reading(i)), error: null },
    { data: [reading(500)], error: null }]);
  assert.equal((await h.fetchAnalyticsReadings('member', p)).length, 501);
  assert.deepEqual(h.calls[0].filters, [['eq', 'user_id', 'member'],
    ['gte', 'recorded_at', '2026-09-26T18:30:00.000Z'], ['lte', 'recorded_at', p.end]]);
  assert.deepEqual(h.calls[1].range, [500, 999]);
  const lateMonth = harness([{ data: [], error: null }]);
  await lateMonth.fetchAnalyticsReadings('member', lateMonth.reportingPeriod(new Date('2026-10-20T06:00:00Z')));
  assert.equal(lateMonth.calls[0].filters[1][2], '2026-09-30T18:30:00.000Z');
});

test('failed or unverifiable energy pages never produce partial daily input', async () => {
  const p = harness().reportingPeriod(new Date('2026-10-04T06:00:00Z'));
  const rows = Array.from({ length: 500 }, (_, id) => ({ id, user_id: 'member', recorded_at: '2026-10-01T00:00:00Z' }));
  const failed = harness([{ data: rows, error: null }, { error: new Error('offline') }]);
  await assert.rejects(failed.fetchAnalyticsReadings('member', p), /offline/);
  for (const patch of [{ user_id: 'other' }, { recorded_at: 'bad' },
    { recorded_at: '2026-08-26T00:00:00Z' }, { recorded_at: '2026-10-05T00:00:00Z' }]) {
    const h = harness([{ data: [{ ...rows[0], ...patch }], error: null }]);
    await assert.rejects(h.fetchAnalyticsReadings('member', p), /verified/);
  }
  const duplicate = harness([{ data: [rows[0], rows[0]], error: null }]);
  await assert.rejects(duplicate.fetchAnalyticsReadings('member', p), /verified/);
  const signedOut = harness();
  assert.deepEqual(await signedOut.fetchAnalyticsReadings(null, p), []);
  assert.equal(signedOut.calls.length, 0);
});
