const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, 'analyticsText.js'), 'utf8').replace('export function ', 'function ');
const { copy, messages } = new Function(`${source}\nreturn { copy: analyticsText, messages };`)();

test('all analytics and history messages exist in each language with matching interpolation fields', () => {
  const fields = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const language of ['en', 'si', 'ta']) {
    assert.deepEqual(Object.keys(messages[language]).sort(), Object.keys(messages.en).sort());
    for (const [key, message] of Object.entries(messages.en)) {
      assert.deepEqual(fields(messages[language][key]), fields(message), `${language}/${key}`);
      const values = Object.fromEntries(fields(message).map((field) => [field, 'TEST']));
      const text = copy(language, key, values);
      assert.ok(text.length > 0);
      assert.equal(/\{\w+\}/.test(text), false);
    }
  }
  assert.equal(copy('ta-LK', 'coverage'), messages.ta.coverage);
  assert.equal(copy('unknown', 'coverage'), messages.en.coverage);
});
