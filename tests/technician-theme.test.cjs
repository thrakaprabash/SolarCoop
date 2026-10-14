const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/technician/theme.js'), 'utf8');
const { TECH_LIGHT, TECH_DARK, resolveTechMode } = new Function(source.replace(/export /g, '') + '\nreturn { TECH_LIGHT, TECH_DARK, resolveTechMode };')();
const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
test('technician appearance follows the device unless the user explicitly selects a mode', () => {
  assert.equal(resolveTechMode('system', 'dark'), 'dark');
  assert.equal(resolveTechMode('system', null), 'light');
  assert.equal(resolveTechMode('light', 'dark'), 'light');
  assert.equal(resolveTechMode('dark', 'light'), 'dark');
});
test('reading text, fault priorities and primary actions meet normal text contrast in both themes', () => {
  for (const palette of [TECH_LIGHT, TECH_DARK]) {
    for (const surface of ['bg', 'card', 'cardRaised', 'heroStart', 'heroEnd']) {
      for (const foreground of ['text', 'textSecondary', 'textMuted', 'orange', 'red', 'amber', 'green']) {
        assert.ok(contrast(palette[foreground], palette[surface]) >= 4.5, `${foreground} on ${surface}`);
      }
    }
    assert.ok(contrast('#FFFFFF', palette.action) >= 4.5);
  }
});
