const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');

// Load production modules with only platform and network boundaries replaced.
function loadModule(path, mocks = {}) {
  const module = { exports: {} };
  const { code } = babel.transformSync(fs.readFileSync(path, 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error('Unexpected dependency: ' + name);
  }, Uint8Array, Date, Error });
  return module.exports;
}
const validation = loadModule('src/technician/utils/repairPhoto.js');
const jpeg = Uint8Array.from([255, 216, 255, 224]).buffer;

test('accepts JPG and PNG bytes and rejects invalid, empty and oversized files', () => {
  assert.equal(validation.validateRepairPhoto(jpeg).contentType, 'image/jpeg');
  assert.equal(validation.validateRepairPhoto(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer).extension, 'png');
  assert.throws(() => validation.validateRepairPhoto(new ArrayBuffer(0)), /empty/);
  assert.throws(() => validation.validateRepairPhoto(Uint8Array.from([71,73,70]).buffer), /JPG or PNG/);
  const limit = new Uint8Array(validation.MAX_PHOTO_BYTES); limit.set([255,216,255]);
  assert.equal(validation.validateRepairPhoto(limit.buffer).size, validation.MAX_PHOTO_BYTES);
  assert.throws(() => validation.validateRepairPhoto(new ArrayBuffer(validation.MAX_PHOTO_BYTES + 1)), /10 MB/);
});

function photoService({ uploadError = null, attachError = null } = {}) {
  const calls = [];
  const supabase = {
    storage: { from: () => ({
      upload: async (path, buffer, options) => { calls.push({ action: 'upload', path, buffer, options }); return { error: uploadError }; },
      remove: async paths => { calls.push({ action: 'cleanup', paths }); return {}; },
    }) },
    rpc: async (name, params) => { calls.push({ action: 'attach', name, params }); return { data: { id: 'job' }, error: attachError }; },
  };
  const service = loadModule('src/technician/services/repairPhotoService.js', {
    'expo-crypto': { randomUUID: () => 'unique-id' },
    '../../lib/supabase': { supabase },
    './jobService': { buildJob: row => row },
    '../utils/photoFile': { readPhotoFile: async () => jpeg },
    '../utils/repairPhoto': validation,
  });
  return { service, calls };
}
const job = { id: 'job', status: 'active', technicianId: 'tech' };

test('uploads an ArrayBuffer under the job path before attaching evidence', async () => {
  const { service, calls } = photoService();
  await service.uploadRepairPhoto(job, 'tech', {});
  assert.deepEqual(calls.map(call => call.action), ['upload', 'attach']);
  assert.equal(calls[0].path, 'job/unique-id.jpg');
  assert.equal(calls[0].buffer, jpeg);
  assert.equal(calls[0].options.upsert, false);
});

test('rejects other technicians, inactive jobs and oversized selections before upload', async () => {
  const { service, calls } = photoService();
  await assert.rejects(service.uploadRepairPhoto(job, 'other', {}), /assigned technician/);
  await assert.rejects(service.uploadRepairPhoto({ ...job, status: 'completed' }, 'tech', {}), /active job/);
  await assert.rejects(service.uploadRepairPhoto(job, 'tech', { fileSize: validation.MAX_PHOTO_BYTES + 1 }), /10 MB/);
  assert.equal(calls.length, 0);
});

test('does not attach a failed upload and cleans up after an attachment failure', async () => {
  let harness = photoService({ uploadError: new Error('upload failed') });
  await assert.rejects(harness.service.uploadRepairPhoto(job, 'tech', {}), /upload failed/);
  assert.deepEqual(harness.calls.map(call => call.action), ['upload']);
  harness = photoService({ attachError: new Error('attach failed') });
  await assert.rejects(harness.service.uploadRepairPhoto(job, 'tech', {}), /attach failed/);
  assert.deepEqual(harness.calls.map(call => call.action), ['upload', 'attach', 'cleanup']);
});
