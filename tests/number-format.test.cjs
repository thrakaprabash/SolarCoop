const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/numberFormat.js'), 'utf8');
const { fixed, power, energy, percent, grouped } = new Function(
  source.replaceAll('export function ', 'function ').replaceAll('export const ', 'const ') +
    '\nreturn { fixed, power, energy, percent, grouped };',
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

test('grouped turns a full-precision total into a short number with thousands separators', () => {
  assert.equal(grouped(1147.9231030990666), '1,147.9');
  assert.equal(grouped(468.32418849381), '468.3');
  assert.equal(grouped(8035.5), '8,035.5');
  assert.equal(grouped(1234567.891, 2), '1,234,567.89');
  assert.equal(grouped(999.96), '1,000.0');
  assert.equal(grouped('1147.92310'), '1,147.9');
});

test('grouped keeps the sign and never prints "-0.0"', () => {
  assert.equal(grouped(-13.4829), '-13.5');
  assert.equal(grouped(-1234.56), '-1,234.6');
  assert.equal(grouped(-0.0001), '0.0');
  assert.equal(grouped(0), '0.0');
});

test('grouped shows a dash for missing or non-numeric values', () => {
  for (const value of [undefined, null, '', 'abc', NaN, Infinity]) {
    assert.equal(grouped(value), '—');
  }
});
