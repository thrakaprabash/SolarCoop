// Isolated PostgreSQL-compatible checks. No Supabase connection is used.
// Reuses the current baseline's trade tables, functions, policies, indexes and ACLs.
// Auth infrastructure is a minimal local stub; unrelated triggers/modules are omitted.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const repo = path.resolve(__dirname, '../../..');
const baseline = fs.readFileSync(path.join(repo, 'database/supabase/migrations/20261008045311_existing_schema.sql'), 'utf8');
const tables = ['profiles', 'energy_records', 'energy_requests', 'transactions'];
const tablePattern = '"public"\\."(?:' + tables.join('|') + ')"';

test('current trade schema passes all ten Phase 6 approval, rejection and access assertions locally', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth; create schema trade_private;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid
      $$;
      grant usage on schema public,auth to anon,authenticated;
    `);
    for (const name of tables) {
      const sql = baseline.match(new RegExp(`CREATE TABLE "public"\\."${name}" \\([\\s\\S]*?^\\);`, 'm'))?.[0];
      assert.ok(sql, `baseline table ${name} exists`);
      await db.exec(sql);
      await db.exec(`alter table public.${name} enable row level security`);
    }
    const addedColumns = [...baseline.matchAll(/^ALTER TABLE "public"\."[^\"]+"\s+ADD COLUMN [\s\S]*?;/gm)]
      .map(match => match[0]).filter(sql => new RegExp(`^ALTER TABLE ${tablePattern}\\s`).test(sql));
    for (const sql of addedColumns) await db.exec(sql);
    const functions = [...baseline.matchAll(/^CREATE OR REPLACE FUNCTION [\s\S]*?AS \$function\$[\s\S]*?\$function\$;/gm)]
      .map(match => match[0]).filter(sql => /^CREATE OR REPLACE FUNCTION (trade_private\.|public\.(trade_|is_admin\())/.test(sql));
    assert.equal(functions.length, 8);
    await db.exec(`begin; set local check_function_bodies=off; ${functions.join('\n')} commit;`);
    const foreignKeys = [...baseline.matchAll(/^ALTER TABLE "public"\."[^\"]+"\s+ADD CONSTRAINT [\s\S]*?;/gm)]
      .map(match => match[0]).filter(sql => new RegExp(`^ALTER TABLE ${tablePattern}\\s`).test(sql));
    for (const sql of foreignKeys) await db.exec(sql);
    const policies = [...baseline.matchAll(/^CREATE POLICY [\s\S]*?;/gm)]
      .map(match => match[0]).filter(sql => new RegExp(` ON ${tablePattern}\\s`).test(sql));
    for (const sql of policies) await db.exec(sql);
    const indexes = [...baseline.matchAll(/^CREATE (?:UNIQUE )?INDEX [\s\S]*?;/gm)]
      .map(match => match[0]).filter(sql => new RegExp(` ON ${tablePattern}\\s`).test(sql));
    for (const sql of indexes) await db.exec(sql);
    const grants = [...baseline.matchAll(/^(?:REVOKE|GRANT) [\s\S]*?;/gm)]
      .map(match => match[0]).filter(sql =>
        /ON FUNCTION "(?:trade_private|public)"\."(?:trade_|available_|approve_request|reject_request)/.test(sql) ||
        /ON SCHEMA "trade_private"/.test(sql) || new RegExp(`ON TABLE ${tablePattern}\\s`).test(sql));
    for (const sql of grants) await db.exec(sql);
    const provider = '11111111-1111-4111-8111-111111111111';
    const requester = '22222222-2222-4222-8222-222222222222';
    const third = '14c3d153-7e44-4140-8a5c-9e6466485d2e';
    await db.exec(`
      insert into auth.users values('${provider}'),('${requester}'),('${third}');
      insert into public.profiles(id,name,role) values
        ('${provider}','Local Provider','owner'),('${requester}','Local Requester','consumer'),('${third}','Local Unrelated','consumer');
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,recorded_at)
        values('${provider}',6.1,1.9,now()-interval '1 hour');
      insert into public.transactions(id,sender_id,receiver_id,energy_amount,status,reference_code)
        values('e3bed65b-5b06-41ce-870e-330558931bec','${provider}','${requester}',0.5,'COMPLETED','LOCAL-SAVED-TRADE');
    `);
    const verification = fs.readFileSync(path.join(repo, 'src/trade/PHASE_6_VERIFY.sql'), 'utf8');
    const results = await db.exec(verification);
    const checks = results.flatMap(result => result.rows || []).filter(row => row.check_name);
    assert.equal(checks.length, 10);
    assert.ok(checks.every(row => row.result === 'PASS'));
    console.log(JSON.stringify(checks, null, 2));
  } finally {
    await db.close();
  }
});
