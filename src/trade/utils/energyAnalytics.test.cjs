const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'energyAnalytics.js'), 'utf8').replace('export function ', 'function ');
const calculate = new Function(`${source}\nreturn calculateDailyAnalytics;`)();
const options = { today: '2026-10-04', contractConfirmed: true };
const day = (date, consumption, production = 0) => ({ date, consumption, production });

test('unknown daily contract cannot turn plausible raw data into measured metrics', () => {
  const result = calculate([day('2026-10-03', 10, 12)], { today: '2026-10-04' });
  assert.equal(result.available, false);
  assert.equal(result.average, null);
  assert.equal(result.generation, null);
});
test('previous seven completed calendar days exclude today and older/future readings', () => {
  // Explicit cross-month calendar window avoids assuming seven latest rows.
  const dates = ['2026-09-27','2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03'];
  const result = calculate([...dates.map((date) => day(date, 10)), day('2026-10-04', 15),
    day('2026-09-26', 999), day('2026-10-05', 999)], options);
  assert.equal(result.average, 10);
  assert.equal(result.baselineDays, 7);
  assert.equal(result.current, 15);
  assert.equal(result.comparison.kind, 'higher');
  assert.equal(result.comparison.provisional, true);
  assert.equal(result.generationDays, 4);
});
test('missing days are excluded with visible coverage; genuine zero remains valid', () => {
  const result = calculate([day('2026-10-01', 10), day('2026-10-02', 0)], options);
  assert.equal(result.average, 5);
  assert.equal(result.baselineDays, 2);
  assert.equal(result.comparison, null);
  assert.equal(result.generation, 0);
  assert.equal(calculate([], options).generation, null);
});
test('duplicate days are unavailable regardless of input order', () => {
  const rows = [day('2026-10-03', 10, 12), day('2026-10-03', 99, 100), day('2026-10-02', 4, 6)];
  for (const input of [rows, [...rows].reverse()]) {
    const result = calculate(input, options);
    assert.equal(result.average, 4);
    assert.equal(result.baselineDays, 1);
    assert.equal(result.generation, 6);
    assert.equal(result.trend, null);
  }
});
test('invalid amounts/dates do not create zero days or invalid numeric results', () => {
  const rows = [null, day('2026-02-30', 100), day('not-a-day', 10),
    ...[null, '', ' ', NaN, Infinity, -1, true].map((value, i) => day(`2026-09-${27+i}`, value, value))];
  const result = calculate(rows, options);
  assert.equal(result.average, null);
  assert.equal(result.comparison, null);
  assert.equal(result.estimatedSolarCoverage, null);
  assert.equal(calculate([], { ...options, today: '2026-02-30' }).available, false);
});
test('zero baseline gives an absolute comparison and never NaN or infinity', () => {
  const above = calculate([day('2026-10-03', 0), day('2026-10-04', 2)], options);
  assert.equal(above.comparison.kind, 'aboveZero');
  assert.equal(above.comparison.percent, null);
  assert.equal(above.comparison.absolute, 2);
  assert.equal(calculate([day('2026-10-03', 0), day('2026-10-04', 0)], options).comparison.kind, 'inLine');
});
test('exact plus/minus ten-percent boundaries stay in line without display rounding', () => {
  for (const [baseline, current, kind] of [[10,11,'inLine'],[10,9,'inLine'],[1,1.1,'inLine'],
    [10,11.001,'higher'],[10,8.999,'lower']]) {
    assert.equal(calculate([day('2026-10-03', baseline), day('2026-10-04', current)], options).comparison.kind, kind);
  }
});
test('trend requires three consecutive completed days in chronological order', () => {
  const rows = [day('2026-10-03', 8), day('2026-10-01', 12), day('2026-10-02', 10), day('2026-10-04', 99)];
  assert.deepEqual(calculate(rows, options).trend, { kind: 'decreasing', values: [12,10,8] });
  assert.equal(calculate(rows.filter((row) => row.date !== '2026-10-02'), options).trend, null);
  assert.equal(calculate([day('2026-10-01', 5),day('2026-10-02', 5),day('2026-10-03', 5)], options).trend, null);
});
test('solar coverage is aligned per day; surplus on one day cannot cover another', () => {
  const result = calculate([day('2026-10-01', 10, 20), day('2026-10-02', 10, 0),
    day('2026-10-03', null, 5), day('2026-09-30', 100, 100)], options);
  assert.equal(result.generation, 25);
  assert.equal(result.generationDays, 3);
  assert.equal(result.estimatedSolarCoverage, 50);
  assert.equal(result.matchedDays, 2);
  assert.equal(calculate([day('2026-10-01', 0, 10)], options).estimatedSolarCoverage, null);
});
test('numeric strings are valid; aggregate overflow remains unavailable', () => {
  assert.equal(calculate([day('2026-10-03', '10.5', '12')], options).average, 10.5);
  const result = calculate([day('2026-10-01', Number.MAX_VALUE, Number.MAX_VALUE),
    day('2026-10-02', Number.MAX_VALUE, Number.MAX_VALUE)], options);
  assert.equal(result.average, null);
  assert.equal(result.generation, null);
  assert.equal(result.estimatedSolarCoverage, null);
});
