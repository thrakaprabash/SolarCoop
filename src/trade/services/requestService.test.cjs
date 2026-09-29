const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadService(supabase) {
  const source = fs.readFileSync(path.join(__dirname, 'requestService.js'), 'utf8');
  const code = source
    .replace("import { supabase } from '../../lib/supabase';", 'const { supabase } = require("../../lib/supabase");')
    .replace('export async function fetchMyRequests', 'async function fetchMyRequests')
    + '\nmodule.exports = { fetchMyRequests };';
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
    { id: '11', name: 'Household', kwh: 1.25, status: 'Pending', ts: '2026-09-28T10:00:00.000Z', rate: null },
  ]);
});

test('empty results and failed reads remain distinct', async () => {
  const empty = fakeSupabase([{ data: [], error: null }]);
  const failed = fakeSupabase([{ data: null, error: new Error('database unavailable') }]);
  assert.deepEqual(await loadService(empty.supabase).fetchMyRequests('member-1'), []);
  assert.equal(empty.calls.length, 1);
  await assert.rejects(loadService(failed.supabase).fetchMyRequests('member-1'), /database unavailable/);
});
