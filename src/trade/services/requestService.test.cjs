const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadService(supabase) {
  const source = fs.readFileSync(path.join(__dirname, 'requestService.js'), 'utf8');
  const code = source
    .replace("import { supabase } from '../../lib/supabase';", 'const { supabase } = require("../../lib/supabase");')
    .replaceAll('export async function ', 'async function ')
    + '\nmodule.exports = { fetchMyRequests, fetchIncomingRequests, approveRequest, rejectRequest };';
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === '../../lib/supabase') return { supabase };
    throw new Error(`Unexpected import: ${specifier}`);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
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
        in(column, values) { call.filters.push(['in', column, values]); return query; },
        order(column, options) { call.order = [column, options]; return query; },
        then(resolve, reject) { return Promise.resolve(responses.shift()).then(resolve, reject); },
      };
      return query;
    },
    rpc(name, args) {
      calls.push({ rpc: name, args });
      return Promise.resolve(responses.shift());
    },
  };
  return { supabase, calls };
}

test('My Requests is scoped to the requester and maps server data for the UI', async () => {
  const { supabase, calls } = fakeSupabase([
    { data: [
      { id: 12, provider_id: 'owner-1', amount_requested_kwh: '2.5', status: 'COMPLETED', created_at: '2026-09-29T10:00:00Z' },
      { id: 11, provider_id: 'owner-2', amount_requested_kwh: '1.25', status: 'PENDING', created_at: '2026-09-28T10:00:00Z' },
    ], error: null },
    { data: [{ id: 'owner-1', name: 'Solar Home' }], error: null },
  ]);
  const { fetchMyRequests } = loadService(supabase);
  const rows = await fetchMyRequests('member-1');

  assert.deepEqual(calls[0].filters, [['eq', 'requester_id', 'member-1']]);
  assert.deepEqual(calls[0].order, ['created_at', { ascending: false }]);
  assert.deepEqual(calls[1].filters, [['in', 'id', ['owner-1', 'owner-2']]]);
  assert.deepEqual(rows.map(({ id, name, kwh, status, ts, rate }) => ({ id, name, kwh, status, ts, rate })), [
    { id: '12', name: 'Solar Home', kwh: 2.5, status: 'Completed', ts: '2026-09-29T10:00:00.000Z', rate: null },
    { id: '11', name: null, kwh: 1.25, status: 'Pending', ts: '2026-09-28T10:00:00.000Z', rate: null },
  ]);
});

test('Incoming Requests is scoped to the provider and maps requester data', async () => {
  const { supabase, calls } = fakeSupabase([
    { data: [
      { id: 18, provider_id: 'owner-1', requester_id: 'member-1', amount_requested_kwh: '0.5', status: 'PENDING', created_at: '2026-09-30T10:00:00Z' },
      { id: 17, provider_id: 'owner-1', requester_id: 'member-2', amount_requested_kwh: '1', status: 'REJECTED', created_at: '2026-09-29T10:00:00Z' },
    ], error: null },
    { data: [{ id: 'member-1', name: 'Test Requester' }], error: null },
  ]);
  const { fetchIncomingRequests } = loadService(supabase);
  const rows = await fetchIncomingRequests('owner-1');

  assert.deepEqual(calls[0].filters, [['eq', 'provider_id', 'owner-1']]);
  assert.deepEqual(calls[1].filters, [['in', 'id', ['member-1', 'member-2']]]);
  assert.deepEqual(rows.map(({ id, name, initials, kwh, status }) => ({ id, name, initials, kwh, status })), [
    { id: '18', name: 'Test Requester', initials: 'TR', kwh: 0.5, status: 'Pending' },
    { id: '17', name: null, initials: '', kwh: 1, status: 'Rejected' },
  ]);
});

test('approve and reject use guarded RPCs and validate request IDs', async () => {
  const { supabase, calls } = fakeSupabase([
    { data: 'transaction-uuid', error: null },
    { data: true, error: null },
  ]);
  const { approveRequest, rejectRequest } = loadService(supabase);
  assert.equal(await approveRequest('18'), 'transaction-uuid');
  assert.equal(await rejectRequest(19), true);
  assert.deepEqual(calls, [
    { rpc: 'trade_approve_request', args: { p_request_id: 18 } },
    { rpc: 'trade_reject_request', args: { p_request_id: 19 } },
  ]);
  await assert.rejects(approveRequest('bad'), /Invalid request ID/);
  assert.equal(calls.length, 2);
});

test('empty results and failed reads remain distinct', async () => {
  const empty = fakeSupabase([{ data: [], error: null }]);
  const failed = fakeSupabase([{ data: null, error: new Error('database unavailable') }]);
  assert.deepEqual(await loadService(empty.supabase).fetchMyRequests('member-1'), []);
  assert.equal(empty.calls.length, 1);
  await assert.rejects(loadService(failed.supabase).fetchMyRequests('member-1'), /database unavailable/);
});
