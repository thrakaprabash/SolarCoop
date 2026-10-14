const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'dailyEnergyReadings.js'), 'utf8').replace('export function ', 'function ');
const normalize = new Function(`${source}\nreturn normalizeDailyReadings;`)();
const calculateSource = fs.readFileSync(path.join(__dirname, 'energyAnalytics.js'), 'utf8').replace('export function ', 'function ');
const calculate = new Function(`${calculateSource}\nreturn calculateDailyAnalytics;`)();
const row = (id, time, production, consumption) => ({ id, recorded_at: time, production_kwh: production, consumption_kwh: consumption });

test('latest snapshot replaces earlier readings, with Colombo dates and exact bigint tie-breaks', () => {
  const rows = [row('9007199254740993', '2026-10-01T18:30:00Z', 8, 5),
    row('9007199254740992', '2026-10-01T18:30:00Z', 7, 4),
    row(1, '2026-10-01T18:29:59Z', 3, 2), row(2, '2026-10-01T04:30:00Z', 1, 1)];
  for (const readings of [rows, [...rows].reverse()]) {
    assert.deepEqual(normalize(readings), [{ date: '2026-10-01', production: 3, consumption: 2 },
      { date: '2026-10-02', production: 8, consumption: 5 }]);
  }
});

test('invalid latest amounts are not replaced by older values or converted to zero', () => {
  const days = normalize([row(1, '2026-10-03T04:00:00Z', 9, 8),
    row(2, '2026-10-03T06:00:00Z', null, -1)]);
  const daily = calculate(days, { today: '2026-10-04', contractConfirmed: true });
  assert.equal(daily.average, null);
  assert.equal(daily.generation, null);
  assert.equal(daily.estimatedSolarCoverage, null);
  assert.throws(() => normalize([row(null, 'bad', 9, 8)]), /invalid/);
});

test('daily snapshots integrate into average, trend, month generation and aligned solar coverage', () => {
  const days = normalize([row(1, '2026-10-01T12:00:00Z', 20, 12),
    row(2, '2026-10-02T12:00:00Z', 0, 10), row(3, '2026-10-03T12:00:00Z', 4, 8),
    row(4, '2026-10-04T08:00:00Z', 2, 15), row(5, '2026-10-01T05:00:00Z', 3, 2)]);
  const daily = calculate(days, { today: '2026-10-04', contractConfirmed: true });
  assert.equal(daily.average, 10);
  assert.equal(daily.baselineDays, 3);
  assert.equal(daily.comparison.kind, 'higher');
  assert.equal(daily.comparison.percent, 50);
  assert.equal(daily.trend.kind, 'decreasing');
  assert.equal(daily.generation, 26);
  assert.equal(daily.estimatedSolarCoverage, 18 / 45 * 100);
});
