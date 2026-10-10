const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const moduleObject = { exports: {} };
const { code } = babel.transformSync(fs.readFileSync('src/technician/utils/jobMutationQueue.js', 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports, Map, Promise });
const { createJobMutationQueue } = moduleObject.exports;

test('writes on one job stay in order and a failed save does not block the next save', async () => {
  const events = [];
  let pending = 0;
  const queue = createJobMutationQueue((id, delta) => { pending += delta; });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const first = queue.enqueue('job', async () => { events.push('first'); await gate; throw new Error('offline'); });
  const rejected = assert.rejects(first, /offline/);
  const second = queue.enqueue('job', async () => { events.push('second'); return 'saved'; });
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(events, ['first']);
  assert.equal(pending, 2);
  release();
  await rejected;
  assert.equal(await second, 'saved');
  assert.deepEqual(events, ['first', 'second']);
  assert.equal(pending, 0);
});

test('different jobs can save independently', async () => {
  const queue = createJobMutationQueue();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const first = queue.enqueue('job-a', () => gate);
  assert.equal(await queue.enqueue('job-b', () => 'saved'), 'saved');
  release(); await first;
});
