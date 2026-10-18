const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const OWNER = '11111111-1111-4111-8111-111111111111';
const CONSUMER = '22222222-2222-4222-8222-222222222222';
const TECH = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const ADMIN = '55555555-5555-4555-8555-555555555555';
const LEGACY = '66666666-6666-4666-8666-666666666666';
const migration = fs.readFileSync('database/supabase/migrations/20261018120000_role_registration_details.sql', 'utf8');
const ownerDetails = { address: '12 Test Lane', district: 'Colombo', city: 'Nugegoda', solarCapacity: 6.4, inverterBrand: 'Unknown', inverterCapacity: 5, panelCount: 16 };

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create table public.profiles(id uuid primary key references auth.users(id),name text,role text,mobile_number text,household_id text unique,solar_capacity_kw numeric,status text);
    create table public.jobs(id uuid primary key default gen_random_uuid(),household_user_id uuid references public.profiles(id),technician_id uuid,site_address text,site_area text);
    create function public.is_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
    grant usage on schema public,auth to anon,authenticated;
    grant select on public.profiles,public.jobs to authenticated;
    insert into auth.users(id) values('${ADMIN}'),('${LEGACY}');
    insert into public.profiles(id,name,role,status) values('${ADMIN}','Admin','admin','active'),('${LEGACY}','Legacy','consumer','active');
  `);
  await db.exec(migration);
  await db.exec(migration); // The same script can safely be reapplied.
  await db.exec(`create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();`);
  return db;
}
async function signup(db, id, role, details, extra = {}) {
  const metadata = { name: 'Test member', role, status: 'active', ...(details ? { registration_details: details, registration_version: 2 } : {}), ...extra };
  return db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', [id, JSON.stringify(metadata)]);
}
async function asUser(db, id, role = 'authenticated') {
  await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false);`);
}

test('role registration persists atomically, protects addresses and supports legacy profiles', async t => {
  const db = await database();
  try {
    await t.test('all roles save their own fields; owner approval is enforced and metadata is scrubbed', async () => {
      await signup(db, OWNER, 'owner', ownerDetails);
      await signup(db, CONSUMER, 'consumer', { address: 'Consumer home', district: 'Galle', city: 'Galle', monthlyConsumption: 0, inverterBrand: 'Deye' });
      await signup(db, TECH, 'technician', { district: 'Kandy', specialization: 'inverter_repair', experienceYears: 0, qualification: 'NVQ reference' });
      await signup(db, OTHER, 'technician', { district: 'Kandy', specialization: 'general_solar' });
      assert.equal((await db.query('select status from public.profiles where id=$1', [OWNER])).rows[0].status, 'pending_approval');
      assert.equal((await db.query('select solar_capacity_kw from public.profiles where id=$1', [OWNER])).rows[0].solar_capacity_kw, '6.4');
      assert.equal((await db.query('select inverter_capacity_kw from public.solar_systems where user_id=$1', [OWNER])).rows[0].inverter_capacity_kw, '5');
      assert.equal((await db.query('select count(*) n from public.solar_systems where user_id=$1', [CONSUMER])).rows[0].n, 0);
      assert.equal((await db.query('select experience_years from public.technician_details where user_id=$1', [TECH])).rows[0].experience_years, 0);
      const metadata = (await db.query('select raw_user_meta_data from auth.users where id=$1', [OWNER])).rows[0].raw_user_meta_data;
      assert.equal(metadata.registration_details, undefined);
    });
    await t.test('invalid signup rolls back auth/profile rows and cannot create an admin', async () => {
      const id = '77777777-7777-4777-8777-777777777777';
      for (const [role, details] of [['owner', { ...ownerDetails, solarCapacity: 101 }], ['owner', { ...ownerDetails, panelCount: 1.5 }], ['consumer', { district: 'Colombo' }], ['technician', { district: 'Kandy', specialization: 'admin' }], ['owner', { ...ownerDetails, district: 'Invalid' }], ['admin', ownerDetails]]) {
        await assert.rejects(signup(db, id, role, details));
        assert.equal((await db.query('select count(*) n from auth.users where id=$1', [id])).rows[0].n, 0);
        assert.equal((await db.query('select count(*) n from public.profiles where id=$1', [id])).rows[0].n, 0);
      }
    });
    await t.test('anon, unrelated households and unassigned technicians cannot read private details', async () => {
      await asUser(db, '', 'anon');
      assert.equal((await db.query('select public.registration_details_version() n')).rows[0].n, 2);
      await assert.rejects(db.query('select * from public.household_details'), /permission denied/);
      await assert.rejects(db.query('select public.save_my_registration_details($1)', [ownerDetails]), /permission denied/);
      for (const id of [CONSUMER, TECH, OTHER]) {
        await asUser(db, id);
        assert.equal((await db.query('select * from public.household_details where user_id=$1', [OWNER])).rows.length, 0);
      }
      await asUser(db, OWNER);
      assert.equal((await db.query('select * from public.household_details')).rows.length, 1);
      await assert.rejects(db.query('select public.apply_registration_details($1,$2)', [CONSUMER, ownerDetails]), /permission denied/);
      await assert.rejects(db.query('update public.household_details set address=$1', ['stolen']), /permission denied/);
    });
    await t.test('jobs show general area; only the assigned technician can fetch the full address', async () => {
      await db.exec('reset role');
      const job = (await db.query('insert into public.jobs(household_user_id) values($1) returning *', [OWNER])).rows[0];
      assert.equal(job.site_address, null);
      assert.equal(job.site_area, 'Nugegoda, Colombo');
      await db.query('update public.jobs set technician_id=$1 where id=$2', [TECH, job.id]);
      await asUser(db, TECH);
      assert.equal((await db.query('select address from public.household_details where user_id=$1', [OWNER])).rows[0].address, '12 Test Lane');
      assert.equal((await db.query('select panel_capacity_kwp from public.solar_systems where user_id=$1', [OWNER])).rows.length, 1);
      await asUser(db, OTHER);
      assert.equal((await db.query('select address from public.household_details where user_id=$1', [OWNER])).rows.length, 0);
      await asUser(db, ADMIN);
      assert.equal((await db.query('select * from public.household_details')).rows.length, 2);
    });
    await t.test('legacy users can fill details and invalid edits leave saved values intact', async () => {
      await asUser(db, LEGACY);
      assert.equal((await db.query('select * from public.household_details')).rows.length, 0);
      await db.query('select public.save_my_registration_details($1)', [{ address: 'Legacy home', city: 'Matara', district: 'Matara', monthlyConsumption: 125 }]);
      assert.equal((await db.query('select address from public.household_details')).rows[0].address, 'Legacy home');
      await asUser(db, OWNER);
      await db.query('select public.save_my_registration_details($1)', [{ ...ownerDetails, solarCapacity: 7.2, inverterBrand: 'Other' }]);
      await assert.rejects(db.query('select public.save_my_registration_details($1)', [{ ...ownerDetails, address: 'Should roll back', solarCapacity: -1 }]));
      const row = (await db.query('select address from public.household_details')).rows[0];
      assert.equal(row.address, '12 Test Lane');
      assert.equal((await db.query('select solar_capacity_kw from public.profiles where id=$1', [OWNER])).rows[0].solar_capacity_kw, '7.2');
    });
  } finally { await db.close(); }
});

test('client validates complete numbers and discards fields belonging to other roles', async () => {
  const source = fs.readFileSync('src/utils/registrationDetails.js', 'utf8');
  const { EMPTY_DETAILS, validateRegistrationDetails, registrationDetailsPayload } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const values = { ...EMPTY_DETAILS, ...ownerDetails, solarCapacity: '6.4', inverterCapacity: '5', panelCount: '16' };
  assert.deepEqual(validateRegistrationDetails('owner', values), {});
  for (const value of ['5abc', 'Infinity', '-5', '101']) assert.ok(validateRegistrationDetails('owner', { ...values, solarCapacity: value }).solarCapacity);
  assert.ok(validateRegistrationDetails('owner', { ...values, panelCount: '1.5' }).panelCount);
  const consumer = registrationDetailsPayload('consumer', { ...values, monthlyConsumption: '0' });
  assert.equal(consumer.solarCapacity, undefined);
  assert.equal(consumer.inverterBrand, undefined);
  assert.equal(consumer.monthlyConsumption, 0);
  const technician = registrationDetailsPayload('technician', { ...values, specialization: 'inverter_repair', experienceYears: '0' });
  assert.equal(technician.address, undefined);
  assert.equal(technician.experienceYears, 0);
});
