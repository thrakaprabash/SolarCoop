const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function harness(services = {}) {
  const load = (file, name) => new Function(`${fs.readFileSync(path.join(__dirname, '..', 'utils', file), 'utf8')
    .replace('export function ', 'function ')}\nreturn ${name};`)();
  const slots = []; let cursor = 0; let user = { id: 'a' };
  const deps = {
    useAuth: () => ({ user, profile: user ? { id: user.id, name: user.id } : null }),
    useEffect: () => {}, useCallback: (fn) => fn,
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
      return [slots[i], (next) => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    reportingPeriod: () => ({ day: '2026-10-03', month: '2026-10' }),
    fetchLatestEnergyReading: async () => null, fetchSharedEnergy: async () => 0, ...services,
    fetchAnalyticsReadings: services.fetchAnalyticsReadings || (async () => []),
    normalizeDailyReadings: load('dailyEnergyReadings.js', 'normalizeDailyReadings'),
    calculateDailyAnalytics: load('energyAnalytics.js', 'calculateDailyAnalytics'),
  };
  const source = fs.readFileSync(path.join(__dirname, 'useEnergyAnalytics.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export function ', 'function ');
  const hook = new Function(...Object.keys(deps), `${source}\nreturn useEnergyAnalytics;`)(...Object.values(deps));
  return { render() { cursor = 0; return hook({ includeLedger: true }); },
    switchUser(id) { user = id ? { id } : null; } };
}
function deferred() { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; }

test('energy failure preserves valid ledger zero and retry recovers independently', async () => {
  let failed = true;
  const h = harness({ fetchLatestEnergyReading: async () => {
    if (failed) throw new Error('offline'); return { id: 1 };
  } });
  await h.render().refresh();
  assert.equal(h.render().shared, 0);
  assert.ok(h.render().energyError);
  assert.equal(h.render().loading, false);
  failed = false; await h.render().refresh();
  assert.equal(h.render().reading.id, 1);
  assert.equal(h.render().energyError, null);
});
test('ledger failure preserves valid reading and leaves total unavailable', async () => {
  const h = harness({ fetchLatestEnergyReading: async () => ({ id: 1 }),
    fetchSharedEnergy: async () => { throw new Error('offline'); } });
  await h.render().refresh();
  assert.equal(h.render().reading.id, 1);
  assert.equal(h.render().shared, null);
  assert.ok(h.render().ledgerError);
});
test('account switch hides prior data immediately and ignores old-account completion', async () => {
  const old = deferred();
  const h = harness({ fetchLatestEnergyReading: (id) => id === 'a' ? old.promise : Promise.resolve({ id: 'b' }) });
  const pending = h.render().refresh(); h.switchUser('b');
  assert.equal(h.render().reading, null); assert.equal(h.render().shared, null);
  await h.render().refresh(); old.resolve({ id: 'a' }); await pending;
  assert.equal(h.render().reading.id, 'b');
  h.switchUser(null); await h.render().refresh();
  assert.equal(h.render().reading, null); assert.equal(h.render().shared, null);
  assert.equal(h.render().loading, false);
});
test('overlapping refresh cannot replace the newest analytics', async () => {
  const old = deferred(); let calls = 0;
  const h = harness({ fetchLatestEnergyReading: () => ++calls === 1 ? old.promise : Promise.resolve({ id: 'latest' }) });
  const pending = h.render().refresh(); await h.render().refresh();
  old.resolve({ id: 'old' }); await pending;
  assert.equal(h.render().reading.id, 'latest');
});

test('history failure leaves independent reading and ledger usable; retry restores calculated metrics', async () => {
  let failed = true;
  const h = harness({ fetchLatestEnergyReading: async () => ({ id: 1 }),
    fetchAnalyticsReadings: async () => {
      if (failed) throw new Error('offline');
      return [{ id: 1, recorded_at: '2026-10-02T12:00:00Z', production_kwh: 12, consumption_kwh: 10 }];
    } });
  await h.render().refresh();
  assert.equal(h.render().daily, null); assert.ok(h.render().dailyError);
  assert.equal(h.render().shared, 0); assert.equal(h.render().reading.id, 1);
  assert.equal(h.render().loading, false);
  failed = false; await h.render().refresh();
  assert.equal(h.render().daily.average, 10); assert.equal(h.render().daily.generation, 12);
  assert.equal(h.render().dailyError, null);
});

test('late historical analytics cannot cross accounts or overwrite a newer refresh', async () => {
  const old = deferred(); let calls = 0;
  const h = harness({ fetchAnalyticsReadings: () => ++calls === 1 ? old.promise : Promise.resolve([]) });
  const pending = h.render().refresh(); h.switchUser('b');
  assert.equal(h.render().daily, null);
  await h.render().refresh();
  old.resolve([{ id: 1, recorded_at: '2026-10-02T12:00:00Z', production_kwh: 99, consumption_kwh: 99 }]);
  await pending;
  assert.equal(h.render().daily.generation, null);
  assert.equal(h.render().daily.average, null);
});
