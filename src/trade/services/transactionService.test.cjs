const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadService(supabase) {
  const source = fs.readFileSync(path.join(__dirname, 'transactionService.js'), 'utf8');
  const code = source
    .replace("import { supabase } from '../../lib/supabase';", 'const { supabase } = require("../../lib/supabase");')
    .replace('export async function ', 'async function ')
    + '\nmodule.exports = { fetchTransactionById };';
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (specifier) => {
      if (specifier === '../../lib/supabase') return { supabase };
      throw new Error(`Unexpected import: ${specifier}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}

function fakeSupabase(responses) {
  const calls = [];
  const supabase = {
    from(table) {
      const call = { table, filters: [] };
      calls.push(call);
      const query = {
        select(columns) { call.columns = columns; return query; },
        eq(column, value) { call.filters.push(['eq', column, value]); return query; },
        or(value) { call.filters.push(['or', value]); return query; },
        in(column, values) { call.filters.push(['in', column, values]); return query; },
        maybeSingle() { return Promise.resolve(responses.shift()); },
        then(resolve, reject) { return Promise.resolve(responses.shift()).then(resolve, reject); },
      };
      return query;
    },
  };
  return { supabase, calls };
}

test('transaction detail is limited to a participant and maps its saved ledger row', async () => {
  const { supabase, calls } = fakeSupabase([
    { data: {
      id: 'transaction-uuid', request_id: 18, sender_id: 'owner-1', receiver_id: 'member-1',
      energy_amount: '0.5', status: 'COMPLETED', reference_code: 'TXN-TEST',
      created_at: '2026-09-30T10:00:00Z',
    }, error: null },
    { data: [{ id: 'owner-1', name: 'Solar Home' }, { id: 'member-1', name: 'Test Requester' }], error: null },
  ]);
  const { fetchTransactionById } = loadService(supabase);
  const transaction = await fetchTransactionById('transaction-uuid', 'member-1');

  assert.deepEqual(calls[0].filters, [
    ['eq', 'id', 'transaction-uuid'],
    ['or', 'sender_id.eq.member-1,receiver_id.eq.member-1'],
  ]);
  assert.deepEqual(calls[1].filters, [['in', 'id', ['owner-1', 'member-1']]]);
  assert.equal(transaction.dir, 'received');
  assert.equal(transaction.sender, 'Solar Home');
  assert.equal(transaction.receiver, 'Test Requester');
  assert.equal(transaction.kwh, 0.5);
  assert.equal(transaction.status, 'COMPLETED');
});

test('missing participant or inaccessible transaction produces no detail', async () => {
  const { supabase, calls } = fakeSupabase([{ data: null, error: null }]);
  const { fetchTransactionById } = loadService(supabase);
  assert.equal(await fetchTransactionById('transaction-uuid', null), null);
  assert.equal(calls.length, 0);
  assert.equal(await fetchTransactionById('transaction-uuid', 'other-member'), null);
  assert.equal(calls.length, 1);
});
