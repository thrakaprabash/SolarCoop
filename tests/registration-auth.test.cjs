const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function authHarness({ version = 2, setupError = null, confirmed = false } = {}) {
  let submitted = null;
  const calls = [];
  const supabase = {
    rpc: async name => { calls.push(name); return { data: version, error: setupError }; },
    auth: { signUp: async payload => {
      submitted = payload;
      const user = { id: 'new-member' };
      return { data: { user, session: confirmed ? { user } : null }, error: null };
    } },
    from: table => {
      calls.push(table);
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
      return query;
    },
  };
  const dependencies = {
    supabase, AUTH_STORAGE_KEY: 'test', AsyncStorage: {},
    createContext: () => ({}), useContext: () => null, useCallback: fn => fn,
    useMemo: fn => fn(), useEffect: () => {}, useState: initial => [initial, () => {}],
  };
  const source = fs.readFileSync('src/context/AuthContext.js', 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '').replaceAll('export const ', 'const ')
    .replace('return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;', 'return value;');
  const provider = new Function(...Object.keys(dependencies), source + '\nreturn AuthProvider;')(...Object.values(dependencies));
  return { value: provider({ children: null }), calls, submitted: () => submitted };
}

test('signup forwards private details into the atomic trigger path with and without an email-confirmed session', async () => {
  for (const confirmed of [true, false]) {
    const h = authHarness({ confirmed });
    const details = { address: 'Test address', city: 'Galle', district: 'Galle', solarCapacity: 6 };
    const result = await h.value.signUp('test@example.com', 'test-only', { name: 'Test', role: 'owner', solarCapacity: 6, registrationDetails: details });
    assert.equal(result.error, null);
    const metadata = h.submitted().options.data;
    assert.deepEqual(metadata.registration_details, details);
    assert.equal(metadata.registration_version, 2);
    assert.equal(metadata.status, 'pending_approval');
    assert.equal(h.calls[0], 'registration_details_version');
  }
});

test('a missing migration blocks account creation; connection errors keep their real cause', async () => {
  const missing = authHarness({ setupError: { code: 'PGRST202' }, version: null });
  const metadata = { role: 'consumer', registrationDetails: { address: 'Test' } };
  assert.equal((await missing.value.signUp('test@example.com', 'test-only', metadata)).error.code, 'REGISTRATION_SETUP_REQUIRED');
  assert.equal(missing.submitted(), null);
  const offline = authHarness({ setupError: { message: 'Network unavailable' }, version: null });
  assert.equal((await offline.value.signUp('test@example.com', 'test-only', metadata)).error.message, 'Network unavailable');
  assert.equal(offline.submitted(), null);
});
