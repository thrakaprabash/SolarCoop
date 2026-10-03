const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// Exercise the provider's async state transitions without mounting native UI.
// Effects are left to the app; each test explicitly starts the relevant read.
function harness(services = {}) {
  const slots = [];
  let cursor = 0;
  let user = { id: 'member-a' };
  const hooks = {
    createContext: () => ({}),
    useContext: () => null,
    useEffect: () => {},
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], (next) => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }];
    },
  };
  const source = fs.readFileSync(path.join(__dirname, 'TradeContext.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replaceAll('export function ', 'function ')
    .replace('export default TradeContext;', '')
    .replace('return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;', 'return value;');
  const dependencies = {
    ...hooks, ENERGY: {}, IMPACT: {}, sum: (values) => values.reduce((a, b) => a + b, 0),
    useAuth: () => ({ user }), useTranslation: () => ({ t: (key) => key }),
    fetchMyRequests: async () => [], fetchIncomingRequests: async () => [],
    approveRequest: async () => 'saved-transaction', rejectRequest: async () => true,
    supabase: { rpc: async () => ({ data: [], error: null }) },
    ...services,
  };
  const provider = new Function(...Object.keys(dependencies), `${source}\nreturn TradeProvider;`)(...Object.values(dependencies));
  return {
    render() { cursor = 0; return provider({ children: null }); },
    switchUser(id) { user = id ? { id } : null; },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('request read failure ends loading and retry recovers the member list', async () => {
  let failed = true;
  const h = harness({ fetchMyRequests: async () => {
    if (failed) throw new Error('Connection unavailable');
    return [{ id: '12', status: 'Completed' }];
  } });
  await h.render().refreshRequests();
  let value = h.render();
  assert.equal(value.requestsLoading, false);
  assert.equal(value.requestsRefreshing, false);
  assert.equal(value.requestsError, 'Connection unavailable');
  assert.deepEqual(value.requests, []);
  failed = false;
  await value.refreshRequests({ refresh: true });
  value = h.render();
  assert.equal(value.requestsError, null);
  assert.equal(value.requestsRefreshing, false);
  assert.equal(value.requests[0].id, '12');
});

test('late account reads cannot show one member data in another account', async () => {
  const old = deferred();
  const h = harness({ fetchMyRequests: (id) => id === 'member-a'
    ? old.promise : Promise.resolve([{ id: 'new-member-request' }]) });
  const pending = h.render().refreshRequests();
  h.switchUser('member-b');
  let value = h.render();
  assert.deepEqual(value.requests, []);
  await value.refreshRequests();
  old.resolve([{ id: 'old-member-request' }]);
  await pending;
  value = h.render();
  assert.deepEqual(value.requests, [{ id: 'new-member-request' }]);
  h.switchUser(null);
  assert.deepEqual(h.render().requests, []);
});

test('an older refresh cannot overwrite a newer request result', async () => {
  const old = deferred();
  let calls = 0;
  const h = harness({ fetchMyRequests: () => ++calls === 1
    ? old.promise : Promise.resolve([{ id: 'latest' }]) });
  const first = h.render().refreshRequests();
  await h.render().refreshRequests({ refresh: true });
  old.resolve([{ id: 'stale' }]);
  await first;
  assert.deepEqual(h.render().requests, [{ id: 'latest' }]);
});

test('failed approval surfaces the server error and reloads pending request and balance', async () => {
  const h = harness({
    approveRequest: async () => { throw new Error('Insufficient available surplus.'); },
    fetchIncomingRequests: async () => [{ id: '18', status: 'Pending' }],
    supabase: { rpc: async () => ({ data: [{ id: 'member-a', available_kwh: '0.25' }], error: null }) },
  });
  const result = await h.render().approveIncoming({ id: '18', status: 'Pending' });
  const value = h.render();
  assert.equal(result.data, null);
  assert.equal(result.error.message, 'Insufficient available surplus.');
  assert.equal(value.incoming[0].status, 'Pending');
  assert.equal(value.surplus, 0.25);
  assert.equal(value.incomingRefreshing, false);
  assert.equal(value.providersLoading, false);
});

test('incoming read failure ends loading and its retry returns authoritative rows', async () => {
  let failed = true;
  const h = harness({ fetchIncomingRequests: async () => {
    if (failed) throw new Error('Incoming unavailable');
    return [{ id: '18', status: 'Rejected' }];
  } });
  await h.render().refreshIncoming();
  assert.equal(h.render().incomingLoading, false);
  assert.equal(h.render().incomingError, 'Incoming unavailable');
  failed = false;
  await h.render().refreshIncoming({ refresh: true });
  assert.equal(h.render().incomingError, null);
  assert.equal(h.render().incomingRefreshing, false);
  assert.equal(h.render().incoming[0].status, 'Rejected');
});
