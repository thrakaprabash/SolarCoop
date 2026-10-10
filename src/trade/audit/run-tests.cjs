// Component-only test entry point. Does not alter the team's package scripts.
// Usage: node src/trade/audit/run-tests.cjs
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = ['utils', 'services', 'context', 'audit'].flatMap(dir =>
  fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.test.cjs'))
    .map(name => path.join(root, dir, name)));
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
