const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/numberFormat.js'), 'utf8');
const { fixed, power, energy, percent } = new Function(
  source.replaceAll('export function ', 'function ').replaceAll('export const ', 'const ') +
    '\nreturn { fixed, power, energy, percent };',
)();

test('a reading that arrives at full precision shows a short, steady number', () => {
  assert.equal(power(0.42391074433922765), '0.42');
  assert.equal(energy(21.0149), '21.01');
  assert.equal(power(2.5), '2.50');
  assert.equal(percent(64.6), '65');
  assert.equal(fixed(34.55, 1), '34.5');
});

test('missing or non-numeric values show a dash instead of NaN, null or undefined', () => {
  for (const value of [undefined, null, '', 'abc', NaN, Infinity]) {
    assert.equal(power(value), '—');
    assert.equal(percent(value), '—');
  }
});

test('numbers that arrive as strings are formatted too', () => {
  assert.equal(power('1.2399'), '1.24');
  assert.equal(percent('98.4'), '98');
});

test('a tiny negative value never prints "-0.00"', () => {
  assert.equal(power(-0.0001), '0.00');
  assert.equal(percent(-0.2), '0');
  assert.equal(power(-1.234), '-1.23');
});

test('zero stays zero', () => {
  assert.equal(power(0), '0.00');
  assert.equal(energy(0), '0.00');
  assert.equal(percent(0), '0');
});
