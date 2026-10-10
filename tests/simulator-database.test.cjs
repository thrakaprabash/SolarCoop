const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
const OWNER = '33333333-3333-4333-8333-333333333333';
const TECH = '11111111-1111-4111-8111-111111111111';
const CONSUMER = '22222222-2222-4222-8222-222222222222';
const TAB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_TAB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const KEY = 'simulator-test-key';

async function database() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key references auth.users(id),name text,mobile_number text,role text,solar_capacity_kw numeric);
    create table public.complaints(id uuid primary key,user_id uuid,type text,description text);
    create table public.transactions(id uuid primary key default gen_random_uuid(),sender_id uuid,receiver_id uuid,energy_amount numeric,status text,created_at timestamptz default now());
    create table public.energy_requests(id bigint generated always as identity primary key);
    create table public.energy_records(id bigint generated always as identity primary key,user_id uuid references public.profiles(id),production_kwh numeric,consumption_kwh numeric,surplus_kwh numeric generated always as (greatest(0,production_kwh-consumption_kwh)) stored,recorded_at timestamptz default now());
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(regexp_replace(name,'/[^/]*$',''),'/') $$;
    insert into auth.users values('${OWNER}'),('${TECH}'),('${CONSUMER}');
    insert into public.profiles values('${OWNER}','Owner','0700000000','owner',4),('${TECH}','Technician','','technician',null),('${CONSUMER}','Consumer','','consumer',0);
  `);
  for (const name of ['001_energy_tables','0002_alerts_and_admin_rls','0003_alert_source','0005_alert_scan_support','0006_technician_jobs','0008_job_repair_photos','0009_job_repair_drafts','0010_job_closure_record','0011_simulator','0012_simulator_auto_devices','0013_simulator_generated_surplus']) {
    try { await db.exec(fs.readFileSync(`supabase/migrations/${name}.sql`, 'utf8').replace(/^\uFEFF/, '')); }
    catch (error) { await db.close(); throw new Error(`${name}: ${error.message} (position ${error.position})`); }
  }
  await db.exec(fs.readFileSync('supabase/migrations/0011_simulator.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/0012_simulator_auto_devices.sql','utf8'));
  await db.query('select public.sim_set_key($1)',[KEY]);
  await db.exec('grant usage on schema public,auth,storage to anon,authenticated; grant select,update on public.jobs to authenticated; grant select,insert on storage.objects to authenticated');
  return db;
}
async function role(db, user = '', name = 'anon') {
  await db.exec(`reset role; set role ${name}; select set_config('request.jwt.claim.sub','${user}',false);`);
}
async function snapshot(db) { return (await db.query('select public.sim_snapshot($1) data',[KEY])).rows[0].data; }
function reading(device, patch={}) {
  return {device_id:device.id,instant_production:3,instant_consumption:1,daily_production:20,daily_consumption:5,battery_level:50,battery_power_flow:0,write_record:true,slot:6,rollover:true,...patch};
}
async function push(db, readings, id = require('node:crypto').randomUUID(), tab=TAB) {
  return db.query('select public.sim_push_tick($1,$2,$3,$4,$5)',[KEY,tab,id,JSON.stringify(readings),'12:00']);
}

test('simulator database: secure RPCs, leases, writes, faults, recovery, backfill and reset', async t => {
  const db = await database();
  let owner, consumer, fault;
  try {
    await role(db);
    await t.test('anon cannot read private tables, set key, or claim with a wrong key',async()=>{
      await assert.rejects(db.query('select * from public.sim_config'),/permission denied/);
      await assert.rejects(db.query('select * from simulator_private.operator_closures'),/permission denied/);
      await assert.rejects(db.query('select public.sim_set_key($1)',[KEY]),/permission denied/);
      await assert.rejects(db.query('select public.sim_snapshot($1)',['wrong']),/Invalid simulator key/);
      assert.equal((await db.query('select public.sim_claim_lease($1,$2) ok',[KEY,TAB])).rows[0].ok,true);
      assert.equal((await db.query('select public.sim_claim_lease($1,$2) ok',[KEY,OTHER_TAB])).rows[0].ok,false);
      await db.query('select public.sim_bootstrap($1,$2)',[KEY,TAB]);
      await db.query('select public.sim_bootstrap($1,$2)',[KEY,TAB]);
      const s = await snapshot(db);
      assert.equal(s.devices.length,2);
      assert.equal(s.config.access_key_hash,undefined);
      owner=s.devices.find(d=>d.household_user_id===OWNER);
      consumer=s.devices.find(d=>d.household_user_id===CONSUMER);
      assert.equal(Number(consumer.capacity_kw),0);
    });
    await t.test('validates numbers, duplicate readings and server-enforced lease; retry is idempotent',async()=>{
      await assert.rejects(push(db,[reading(owner)],undefined,OTHER_TAB),/Another tab/);
      await assert.rejects(push(db,[reading(owner,{daily_production:-1})]),/Invalid reading/);
      await assert.rejects(push(db,[reading(owner),reading(owner)]),/Duplicate/);
      await assert.rejects(push(db,[reading(consumer)]),/capacity/);
      const id=require('node:crypto').randomUUID();
      await push(db,[reading(owner)],id); await push(db,[reading(owner)],id);
      await db.exec('reset role');
      const m=(await db.query('select * from public.energy_metrics where user_id=$1',[OWNER])).rows[0];
      assert.equal(Number(m.instant_production),3); assert.equal(m.is_simulated,true);
      assert.equal((await db.query('select * from public.energy_records where is_simulated')).rows.length,1);
      const chart=(await db.query("select * from public.chart_data where user_id=$1 and range='day'",[OWNER])).rows[0];
      assert.equal(chart.hours.length,12); assert.equal(Number(chart.production[6]),3);
      await db.query("insert into public.transactions(sender_id,receiver_id,energy_amount,status) values($1,$2,2,'COMPLETED')",[OWNER,CONSUMER]);
      await role(db); await push(db,[reading(owner)]);
      await db.exec('reset role');
      assert.equal(Number((await db.query('select trade_private.available_kwh($1) surplus_kwh',[OWNER])).rows[0].surplus_kwh),13);
      assert.equal(Number((await db.query('select surplus_kwh from public.energy_records where user_id=$1 order by recorded_at desc,id desc limit 1',[OWNER])).rows[0].surplus_kwh),15);
      await role(db);
    });
    await t.test('fault inserts one telemetry job, alert and offline device atomically',async()=>{
      fault=(await db.query('select public.sim_inject_fault($1,$2,$3,$4,$5) data',[KEY,TAB,owner.id,'E01','{}'])).rows[0].data;
      await assert.rejects(db.query('select public.sim_inject_fault($1,$2,$3,$4,$5)',[KEY,TAB,owner.id,'E01','{}']),/device_faults_one_open/);
      const s=await snapshot(db); assert.equal(s.devices.find(d=>d.id===owner.id).status,'offline');
      assert.equal(s.faults[0].job_status,'pending');
      await db.exec('reset role');
      const j=(await db.query('select * from public.jobs where id=$1',[fault.job_id])).rows[0];
      assert.equal(j.source,'telemetry'); assert.equal(j.error_code,'E01'); assert.equal(j.is_simulated,true);
      assert.equal((await db.query('select severity from public.alerts where id=$1',[fault.alert_id])).rows[0].severity,'critical');
      await role(db); await push(db,[reading(owner)]);
      assert.equal(Number((await snapshot(db)).devices.find(d=>d.id===owner.id).metrics.instant_production),0);
    });
    await t.test('technician completion requires evidence and automatically restores the system',async()=>{
      await role(db,TECH,'authenticated');
      await db.query("update public.jobs set status='active',technician_id=$1,technician_name='Technician' where id=$2",[TECH,fault.job_id]);
      await assert.rejects(db.query('select public.complete_job_ticket($1,$2)',[fault.job_id,'Checked and repaired inverter']),/repair photo/);
      const path=fault.job_id+'/repair.jpg';
      await db.query("insert into storage.objects(bucket_id,name,metadata) values('repair-evidence',$1,'{\"mimetype\":\"image/jpeg\",\"size\":1024}')",[path]);
      await db.query('select public.attach_job_repair_photo($1,$2)',[fault.job_id,path]);
      await db.query('select public.complete_job_ticket($1,$2)',[fault.job_id,'Checked and repaired inverter']);
      await role(db); const s=await snapshot(db); assert.equal(s.faults.length,0);
      assert.equal(s.devices.find(d=>d.id===owner.id).status,'online');
      await db.exec('reset role');
      assert.equal((await db.query('select status from public.device_faults where id=$1',[fault.id])).rows[0].status,'resolved_by_job');
      assert.equal((await db.query('select status from public.alerts where id=$1',[fault.alert_id])).rows[0].status,'resolved');
      await role(db); await push(db,[reading(owner)]);
      assert.equal(Number((await snapshot(db)).devices.find(d=>d.id===owner.id).metrics.instant_production),3);
    });
    await t.test('E06 validates string, manual clear closes pending and active jobs; E07 skips all readings',async()=>{
      await assert.rejects(db.query('select public.sim_inject_fault($1,$2,$3,$4,$5)',[KEY,TAB,owner.id,'E06','{"string":99}']),/valid string/);
      await db.query('select public.sim_inject_fault($1,$2,$3,$4,$5)',[KEY,TAB,owner.id,'E06','{"string":2}']);
      assert.ok((await snapshot(db)).devices.find(d=>d.id===owner.id).panel_health.some(h=>Number(h)===0));
      await db.query('select public.sim_clear_fault($1,$2,$3)',[KEY,TAB,owner.id]);
      assert.ok((await snapshot(db)).devices.find(d=>d.id===owner.id).panel_health.every(h=>Number(h)===1));
      fault=(await db.query('select public.sim_inject_fault($1,$2,$3,$4,$5) data',[KEY,TAB,owner.id,'E07','{}'])).rows[0].data;
      const before=(await snapshot(db)).devices.find(d=>d.id===owner.id).metrics.updated_at;
      await push(db,[reading(owner)]);
      assert.equal((await snapshot(db)).devices.find(d=>d.id===owner.id).metrics.updated_at,before);
      await role(db,TECH,'authenticated');
      await db.query("update public.jobs set status='active',technician_id=$1 where id=$2",[TECH,fault.job_id]);
      await role(db); await db.query('select public.sim_clear_fault($1,$2,$3)',[KEY,TAB,owner.id]);
      await db.exec('reset role');
      const closed=(await db.query('select * from public.jobs where id=$1',[fault.job_id])).rows[0];
      assert.equal(closed.status,'completed'); assert.equal(closed.closure_record.source,'simulator');
      await assert.rejects(db.query("update public.jobs set status='active' where id=$1",[fault.job_id]),/cannot be changed/);
      await role(db);
    });
    await t.test('backfill is repeatable; reset restores originals and preserves unrelated records',async()=>{
      await db.query('select public.sim_backfill($1,$2,$3)',[KEY,TAB,7]);
      await db.query('select public.sim_backfill($1,$2,$3)',[KEY,TAB,7]);
      await db.exec('reset role');
      assert.equal((await db.query("select * from public.energy_records where recorded_at<date_trunc('day',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo' and is_simulated")).rows.length,14);
      await db.query('insert into public.energy_records(user_id,production_kwh,consumption_kwh) values($1,1,1)',[CONSUMER]);
      await db.query("insert into public.jobs(title,household_user_id) values('Real complaint',$1)",[CONSUMER]);
      await role(db);
      await db.query('select public.sim_inject_fault($1,$2,$3,$4,$5)',[KEY,TAB,owner.id,'E01','{}']);
      await db.query('select public.sim_reset($1,$2,$3)',[KEY,TAB,'data']);
      assert.equal((await snapshot(db)).faults.length,0);
      await db.exec('reset role');
      assert.equal((await db.query('select * from public.energy_records')).rows.length,1);
      const restored=(await db.query('select * from public.energy_metrics where user_id=$1',[OWNER])).rows[0];
      assert.equal(restored.is_simulated,false); assert.equal(Number(restored.instant_production),8.5);
      assert.equal((await db.query("select * from public.chart_data where user_id=$1 and range='day'",[OWNER])).rows[0].hours.length,8);
      await role(db); await db.query('select public.sim_reset($1,$2,$3)',[KEY,TAB,'all']);
      assert.equal((await snapshot(db)).devices.length,0);
      await db.exec('reset role');
      assert.equal((await db.query('select * from public.jobs')).rows.length,1);
      assert.equal((await db.query('select * from public.transactions')).rows.length,1);
    });
    await t.test('expired lease cannot write and a viewer can take over',async()=>{
      await db.exec('reset role');
      await db.exec("update public.sim_config set lease_until=now()-interval '1 second'");
      await role(db);
      await assert.rejects(db.query('select public.sim_update_config($1,$2,$3)',[KEY,TAB,'{"running":true}']),/Another tab/);
      assert.equal((await db.query('select public.sim_claim_lease($1,$2) ok',[KEY,OTHER_TAB])).rows[0].ok,true);
      await db.query('select public.sim_update_config($1,$2,$3)',[KEY,OTHER_TAB,'{"weather":"rain"}']);
      assert.equal((await snapshot(db)).config.weather,'rain');
    });
  } finally { await db.close(); }
});


test('new members receive virtual hardware and role changes clean up old faults', async () => {
  const db=await database();
  const id='44444444-4444-4444-8444-444444444444';
  try {
    await db.query('insert into auth.users values($1)',[id]);
    await db.query("insert into public.profiles(id,name,role) values($1,'New owner','owner')",[id]);
    let device=(await db.query('select * from public.sim_devices where household_user_id=$1',[id])).rows[0];
    assert.equal(Number(device.capacity_kw),4); assert.equal(device.panel_count,10);
    await db.query('update public.sim_devices set capacity_kw=6 where id=$1',[device.id]);
    await db.query("update public.profiles set name='Renamed owner' where id=$1",[id]);
    assert.equal(Number((await db.query('select capacity_kw from public.sim_devices where id=$1',[device.id])).rows[0].capacity_kw),6);
    await role(db);
    await db.query('select public.sim_claim_lease($1,$2)',[KEY,TAB]);
    const fault=(await db.query('select public.sim_inject_fault($1,$2,$3,$4,$5) data',[KEY,TAB,device.id,'E01','{}'])).rows[0].data;
    await db.exec('reset role');
    await db.query("update public.profiles set role='consumer' where id=$1",[id]);
    device=(await db.query('select * from public.sim_devices where household_user_id=$1',[id])).rows[0];
    assert.equal(Number(device.capacity_kw),0);assert.equal(device.panel_count,0);
    assert.equal(device.active_fault_id,null);assert.equal(device.status,'online');
    assert.equal((await db.query('select status from public.jobs where id=$1',[fault.job_id])).rows[0].status,'completed');
    assert.equal((await db.query('select status from public.device_faults where id=$1',[fault.id])).rows[0].status,'resolved_manual');
    await db.query("update public.profiles set role='owner',solar_capacity_kw=8 where id=$1",[id]);
    assert.equal(Number((await db.query('select capacity_kw from public.sim_devices where household_user_id=$1',[id])).rows[0].capacity_kw),8);
    await db.query("update public.profiles set role='technician' where id=$1",[id]);
    assert.equal((await db.query('select * from public.sim_devices where household_user_id=$1',[id])).rows.length,0);
    assert.equal((await db.query('select * from public.sim_devices where household_user_id=$1',[TECH])).rows.length,0);
  } finally {await db.close();}
});
