const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadService(supabase) {
  const source = fs.readFileSync(path.join(__dirname, 'transactionService.js'), 'utf8');
  const code = source
    .replace("import { supabase } from '../../lib/supabase';", 'const { supabase } = require("../../lib/supabase");')
    .replaceAll('export async function ', 'async function ')
    + '\nmodule.exports = { fetchTransactionById, fetchTransactionByRequestId, fetchMyTransactions };';
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
        order(column, options) { (call.orders ||= []).push([column, options]); return query; },
        range(start, end) { call.range = [start, end]; return query; },
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

test('completed request resolves to a participant-scoped transaction UUID', async () => {
  const { supabase, calls } = fakeSupabase([
    { data: { id: 'transaction-uuid' }, error: null },
    { data: {
      id: 'transaction-uuid', request_id: 18, sender_id: 'owner-1', receiver_id: 'member-1',
      energy_amount: '0.5', status: 'COMPLETED', reference_code: 'TXN-TEST',
      created_at: '2026-09-30T10:00:00Z',
    }, error: null },
    { data: [{ id: 'owner-1', name: 'Solar Home' }, { id: 'member-1', name: 'Test Requester' }], error: null },
  ]);
  const { fetchTransactionByRequestId } = loadService(supabase);
  const transaction = await fetchTransactionByRequestId('18', 'owner-1');

  assert.deepEqual(calls[0].filters, [
    ['eq', 'request_id', 18],
    ['or', 'sender_id.eq.owner-1,receiver_id.eq.owner-1'],
  ]);
  assert.deepEqual(calls[1].filters, [
    ['eq', 'id', 'transaction-uuid'],
    ['or', 'sender_id.eq.owner-1,receiver_id.eq.owner-1'],
  ]);
  assert.equal(transaction.id, 'transaction-uuid');
  assert.equal(transaction.dir, 'sent');
});

test('a request with no accessible transaction remains unavailable', async () => {
  const { supabase, calls } = fakeSupabase([{ data: null, error: null }]);
  const { fetchTransactionByRequestId } = loadService(supabase);
  assert.equal(await fetchTransactionByRequestId('bad', 'owner-1'), null);
  assert.equal(calls.length, 0);
  assert.equal(await fetchTransactionByRequestId('18', 'other-member'), null);
  assert.equal(calls.length, 1);
});

test('reversed transactions preserve their saved status and direction', async () => {
  const { supabase } = fakeSupabase([
    { data: {
      id: 'reversed-uuid', request_id: 20, sender_id: 'owner-1', receiver_id: 'member-1',
      energy_amount: '1', status: 'REVERSED', reference_code: 'TXN-REVERSED',
      created_at: '2026-09-30T10:00:00Z',
    }, error: null },
    { data: [], error: null },
  ]);
  const transaction = await loadService(supabase).fetchTransactionById('reversed-uuid', 'owner-1');
  assert.equal(transaction.status, 'REVERSED');
  assert.equal(transaction.dir, 'sent');
  assert.equal(transaction.kwh, 1);
});

test('lookup failures are surfaced to the retry state', async () => {
  const failed = fakeSupabase([{ data: null, error: new Error('connection unavailable') }]);
  await assert.rejects(
    loadService(failed.supabase).fetchTransactionByRequestId('18', 'owner-1'),
    /connection unavailable/,
  );
});

test('history reads every page and scopes both directions to the current member', async () => {
  const sent = Array.from({ length: 500 }, (_, id) => ({
    id: `txn-${id}`, sender_id: 'owner-1', receiver_id: 'member-1',
    energy_amount: '0.5', status: 'COMPLETED', created_at: '2026-09-30T10:00:00Z',
  }));
  const { supabase, calls } = fakeSupabase([
    { data: sent, error: null },
    { data: [{ ...sent[0], id: 'received-1', sender_id: 'member-1', receiver_id: 'owner-1' }], error: null },
    { data: [{ id: 'member-1', name: 'Other Member' }], error: null },
  ]);
  const rows = await loadService(supabase).fetchMyTransactions('owner-1');
  assert.equal(rows.length, 501);
  assert.deepEqual(calls[0].range, [0, 499]);
  assert.deepEqual(calls[1].range, [500, 999]);
  assert.deepEqual(calls[0].filters, [['or', 'sender_id.eq.owner-1,receiver_id.eq.owner-1']]);
  assert.deepEqual(calls[0].orders, [['created_at', { ascending: false }], ['id', { ascending: false }]]);
  assert.equal(rows[0].dir, 'sent');
  assert.equal(rows[500].dir, 'received');
  assert.equal(rows[500].party, 'Other Member');
});

test('empty history, signed-out history and failed history remain distinct', async () => {
  const empty = fakeSupabase([{ data: [], error: null }]);
  const service = loadService(empty.supabase);
  assert.deepEqual(await service.fetchMyTransactions(null), []);
  assert.equal(empty.calls.length, 0);
  assert.deepEqual(await service.fetchMyTransactions('owner-1'), []);
  assert.equal(empty.calls.length, 1);
  const failed = fakeSupabase([{ data: null, error: new Error('history unavailable') }]);
  await assert.rejects(loadService(failed.supabase).fetchMyTransactions('owner-1'), /history unavailable/);
});
