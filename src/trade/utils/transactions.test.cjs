const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'transactions.js'), 'utf8')
  .replace("import { monthLabel } from './format';", 'const monthLabel = (date) => `${date.getFullYear()}-${date.getMonth()}`;')
  .replaceAll('export ', '');
const helpers = new Function(`${source}; return { monthTotals, matchesFilter, groupByMonth, byNewest };`)();

test('monthly completed totals exclude reversals and other months/years', () => {
  const rows = [
    { ts: '2026-09-10T12:00:00', status: 'COMPLETED', dir: 'sent', kwh: 0.5 },
    { ts: '2026-09-11T12:00:00', status: 'COMPLETED', dir: 'received', kwh: 2 },
    { ts: '2026-09-12T12:00:00', status: 'REVERSED', dir: 'sent', kwh: 10 },
    { ts: '2026-08-12T12:00:00', status: 'COMPLETED', dir: 'sent', kwh: 10 },
    { ts: '2025-09-12T12:00:00', status: 'COMPLETED', dir: 'received', kwh: 10 },
  ];
  assert.deepEqual(helpers.monthTotals(rows, new Date(2026, 8, 30)), { sent: 0.5, received: 2 });
  assert.equal(rows.filter((row) => helpers.matchesFilter(row, 'Sent')).length, 3);
  assert.equal(rows.filter((row) => helpers.matchesFilter(row, 'Received')).length, 2);
});

test('newest order and month groups preserve both years and directions', () => {
  const rows = [
    { id: 1, ts: '2025-09-10T12:00:00' },
    { id: 2, ts: '2026-09-12T12:00:00' },
    { id: 3, ts: '2026-09-11T12:00:00' },
  ].sort(helpers.byNewest);
  assert.deepEqual(rows.map((row) => row.id), [2, 3, 1]);
  assert.deepEqual(helpers.groupByMonth(rows).map((group) => group.items.map((row) => row.id)), [[2, 3], [1]]);
});
