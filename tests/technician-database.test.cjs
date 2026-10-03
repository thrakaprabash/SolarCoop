const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

const TECH = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const OWNER = '33333333-3333-4333-8333-333333333333';
const JOB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PATH = JOB + '/repair.jpg';

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role authenticated;
    create role anon;
    create schema auth;
    create schema storage;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table public.profiles (id uuid primary key, name text, mobile_number text, role text);
    create table public.complaints (id uuid primary key, user_id uuid, type text, description text);
    create function public.is_admin() returns boolean language sql stable security definer as
      $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb, unique(bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select string_to_array(regexp_replace(name, '/[^/]*$', ''), '/') $$;
    insert into public.profiles values
      ('${TECH}', 'Technician', '', 'technician'), ('${OTHER}', 'Other technician', '', 'technician'),
      ('${OWNER}', 'Household', '', 'consumer');
  `);
  await db.exec(fs.readFileSync('supabase/migrations/0006_technician_jobs.sql', 'utf8'));
  const photoMigration = fs.readFileSync('supabase/migrations/0008_job_repair_photos.sql', 'utf8');
  await db.exec(photoMigration);
  await db.exec(fs.readFileSync('supabase/migrations/0009_job_repair_drafts.sql', 'utf8'));
  await db.exec(photoMigration); // migrations must also tolerate being run again in the SQL Editor.
  await db.exec(`
    grant usage on schema public, storage, auth to authenticated, anon;
    grant select, insert, update on public.jobs to authenticated;
    grant select, insert, delete on storage.objects to authenticated;
    insert into public.jobs(id, title, household_user_id, technician_id, status)
      values ('${JOB}', 'Repair inverter', '${OWNER}', '${TECH}', 'active');
  `);
  return db;
}
async function asUser(db, id, role = 'authenticated') {
  await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub', '${id}', false);`);
}
async function upload(db, path = PATH) {
  return db.query(`insert into storage.objects(bucket_id, name, metadata) values
    ('repair-evidence', $1, '{"mimetype":"image/jpeg","size":1024}')`, [path]);
}
async function attach(db, path = PATH) {
  return db.query('select (public.attach_job_repair_photo($1, $2)).*', [JOB, path]);
}

test('private photo policies deny other technicians and households; saved evidence cannot be deleted', async () => {
  const db = await database();
  try {
    await asUser(db, TECH);
    await upload(db);
    const result = await attach(db);
    assert.equal(result.rows[0].repair_photos[0].path, PATH);
    assert.equal(result.rows[0].repair_photos[0].uploadedBy, TECH);
    assert.ok(result.rows[0].repair_photos[0].uploadedAt);
    await attach(db);
    assert.equal((await db.query('select repair_photos from public.jobs where id=$1', [JOB])).rows[0].repair_photos.length, 1);
    assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 0);
    for (const id of [OTHER, OWNER]) {
      await asUser(db, id);
      assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
      await assert.rejects(upload(db, JOB + '/other.jpg'), /row-level security/);
      await assert.rejects(attach(db), /assigned technician/);
    }
    await asUser(db, '', 'anon');
    await assert.rejects(attach(db), /permission denied/);
  } finally { await db.close(); }
});

test('attachment requires a real matching upload, valid metadata and an active job', async () => {
  const db = await database();
  try {
    await asUser(db, TECH);
    await assert.rejects(attach(db), /Upload a JPG or PNG/);
    await upload(db);
    await db.exec('reset role');
    await db.query(`update storage.objects set metadata='{"mimetype":"image/gif","size":1024}'`);
    await asUser(db, TECH);
    await assert.rejects(attach(db), /JPG or PNG/);
    await db.exec('reset role');
    await db.query(`update storage.objects set metadata='{"mimetype":"image/jpeg","size":10485761}'`);
    await asUser(db, TECH);
    await assert.rejects(attach(db), /10 MB/);
    await db.exec('reset role');
    await db.query(`update public.jobs set status='completed' where id=$1`, [JOB]);
    await asUser(db, TECH);
    await assert.rejects(upload(db, JOB + '/late.jpg'), /row-level security/);
    await assert.rejects(attach(db), /active job/);
  } finally { await db.close(); }
});

test('checklist toggles keep saved steps and notes persist without closing the job', async () => {
  const db = await database();
  try {
    await asUser(db, TECH);
    const toggle = index => db.query('select (public.toggle_job_checklist_item($1, $2)).*', [JOB, index]);
    await toggle(0);
    const after = await toggle(1);
    assert.equal(after.rows[0].diagnostic_checklist[0].done, true);
    assert.equal(after.rows[0].diagnostic_checklist[1].done, true);
    await toggle(0);
    assert.equal((await db.query('select diagnostic_checklist from public.jobs where id=$1', [JOB])).rows[0].diagnostic_checklist[0].done, false);
    await assert.rejects(toggle(-1), /does not exist/);
    await assert.rejects(toggle(99), /does not exist/);
    const saved = await db.query('select (public.save_job_resolution_notes($1, $2)).*', [JOB, '  Replaced connector  ']);
    assert.equal(saved.rows[0].resolution_notes, 'Replaced connector');
    assert.equal(saved.rows[0].status, 'active');
    await db.query('select public.save_job_resolution_notes($1, $2)', [JOB, '']);
    await assert.rejects(db.query('select public.save_job_resolution_notes($1, $2)', [JOB, 'x'.repeat(501)]), /500 characters/);
    await asUser(db, OTHER);
    await assert.rejects(toggle(0), /assigned technician/);
    await assert.rejects(db.query('select public.save_job_resolution_notes($1, $2)', [JOB, 'Not my repair']), /assigned technician/);
  } finally { await db.close(); }
});
