const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const moduleFrom = file => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(file)).toString('base64'));

test('simulator daily totals use final Colombo readings and skip the partial current day', async () => {
  const { dailyReadings, memberEnergyChecks, communityEnergyChecks, colomboDay } = await moduleFrom('src/admin/services/alertRules.js');
  const now = new Date('2026-10-10T07:00:00Z');
  const members = [{ id: 'a', name: 'Owner', status: 'Active' }, { id: 'b', name: 'Consumer', status: 'Active' }];
  const rows = [
    { at: new Date('2026-10-10T06:00:00Z'), production: 0, consumption: 1, isSimulated: true },
    ...[9, 8, 7, 6].flatMap(day => [
      { at: new Date(`2026-10-${String(day).padStart(2,'0')}T18:29:00Z`), production: 10, consumption: 12, isSimulated: true },
      { at: new Date(`2026-10-${String(day).padStart(2,'0')}T00:00:00Z`), production: 1, consumption: 50, isSimulated: true },
    ]),
  ];
  assert.equal(colomboDay(new Date('2026-10-09T19:00:00Z')), '2026-10-10');
  assert.equal(dailyReadings(rows).length, 5);
  const input = { members, readingsByUser: new Map(members.map(m => [m.id, rows])) };
  assert.deepEqual(memberEnergyChecks(input, now), []);
  const deficit = communityEnergyChecks(input, now).find(c => c.type === 'community_deficit');
  assert.match(deficit.message, /12 kWh short/); // 2 kWh × 2 households × 3 days, not snapshot sums
  const faulty = rows.map(r => ({ ...r, production: r.at.getUTCDate() === 9 ? 0 : r.production }));
  assert.equal(memberEnergyChecks({ members: [members[0]], readingsByUser: new Map([['a', faulty]]) }, now)[0].type, 'zero_production');
});

test('recovery respects failed checks and cooldown starts at manual resolution, not creation', async () => {
  const { recoveredAlertIds, shouldRaise } = await moduleFrom('src/admin/services/alertRules.js');
  const now = new Date('2026-10-10T12:00:00Z');
  const old = new Date('2026-10-01T12:00:00Z');
  const existing = new Map([
    ['zero_production:a', [{ id: 'energy', status: 'active', at: old }]],
    ['signup_pending:b', [{ id: 'signup', status: 'active', at: old }]],
    ['large_transaction:c', [{ id: 'trade', status: 'active', at: old }]],
  ]);
  assert.deepEqual(recoveredAlertIds(existing, [], [{ check: 'member_energy' }]), ['signup']);
  assert.deepEqual(recoveredAlertIds(existing, [{ dedupeKey: 'zero_production:a' }], []), ['signup']);
  const candidate = { dedupeKey: 'zero_production:a' };
  existing.set(candidate.dedupeKey, [{ status: 'resolved', at: old, resolvedAt: now, autoResolved: false }]);
  assert.equal(shouldRaise(candidate, existing, now), false);
  existing.get(candidate.dedupeKey)[0].autoResolved = true;
  assert.equal(shouldRaise(candidate, existing, now), true);
});

test('pagination preserves history beyond 1000 rows and fails rather than returning partial data', async () => {
  const { fetchPages } = await moduleFrom('src/admin/services/pagination.js');
  const rows = Array.from({ length: 1203 }, (_, id) => ({ id }));
  const ranges = [];
  const result = await fetchPages(() => ({ async range(start, end) {
    ranges.push([start, end]); return { data: rows.slice(start, end + 1) };
  } }));
  assert.deepEqual(result, rows);
  assert.deepEqual(ranges, [[0,499],[500,999],[1000,1499]]);
  await assert.rejects(fetchPages(() => ({ async range(start) {
    return start ? { error: Error('connection lost') } : { data: rows.slice(0,500) };
  } })), /connection lost/);
});

test('admin live updates debounce events, poll silently, refresh on foreground and clean up', () => {
  const effects = [], intervals = [], callbacks = [], refreshed = [], cleared = [];
  let pending, foreground, removed = false;
  const loads = name => options => refreshed.push([name, options]);
  const channel = { on(_event, filter, callback) { callbacks.push({ filter, callback }); return channel; }, subscribe() { return channel; } };
  const deps = {
    useAdmin: () => ({ loadMembers: () => {}, loadComplaints: () => {},
      loadTransactions: loads('ledger'), loadAlerts: loads('alerts'), scanAlerts: loads('scan') }),
    useEffect: callback => effects.push(callback),
    supabase: { channel: () => channel, removeChannel: () => { removed = true; } },
    AppState: { currentState: 'active', addEventListener: (_name, callback) => {
      foreground = callback; return { remove: () => { foreground = null; } };
    } },
    setTimeout: callback => { pending = callback; return callback; }, clearTimeout: timer => cleared.push(timer),
    setInterval: (callback, ms) => { intervals.push({ callback, ms }); return callback; },
    clearInterval: timer => cleared.push(timer),
  };
  const source = fs.readFileSync('src/admin/AdminPortal.js','utf8');
  const shell = source.slice(source.indexOf('function AdminShell()'), source.indexOf('  const renderScreen')) + '}';
  new Function(...Object.keys(deps), shell + ';AdminShell();')(...Object.values(deps));
  const stop = effects[1]();
  assert.deepEqual(callbacks.map(c => c.filter.table), ['transactions','alerts']);
  callbacks[0].callback(); callbacks[1].callback(); pending();
  assert.deepEqual(refreshed, [['ledger',{ silent:true }],['alerts',{ silent:true }]]);
  refreshed.length = 0;
  intervals.find(t => t.ms === 10_000).callback();
  assert.equal(refreshed.length, 2);
  deps.AppState.currentState = 'background'; refreshed.length = 0;
  intervals.forEach(t => t.callback()); assert.equal(refreshed.length, 0);
  deps.AppState.currentState = 'active'; foreground('active');
  assert.equal(refreshed.length, 3);
  stop(); assert(removed); assert.equal(foreground, null); assert(cleared.length >= 4);
});

test('admin refresh responses cannot undo a newer read or a completed alert mutation', async () => {
  const slots = []; let cursor = 0, fetchAlerts = async () => [];
  const deps = {
    createContext: () => ({}), useContext: () => null, useCallback: f => f,
    useRef(initial) { const i=cursor++; if (!(i in slots)) slots[i]={ current:initial }; return slots[i]; },
    useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial;
      return [slots[i], next => slots[i]=typeof next === 'function' ? next(slots[i]) : next]; },
    fetchAllAlerts: () => fetchAlerts(), serviceResolveAlert: async id => ({ id, status:'Resolved' }),
  };
  const source = fs.readFileSync('src/admin/context/AdminContext.js','utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm,'').replaceAll('export const ','const ')
    .replace(/return \(\s*<AdminContext.Provider\s+value=\{\{/,'return ({')
    .replace(/\}\}\s*>\s*\{children\}\s*<\/AdminContext.Provider>\s*\);/,'});');
  const provider = new Function(...Object.keys(deps),source+';return AdminProvider;')(...Object.values(deps));
  const render = () => { cursor=0; return provider({}); };
  let release;
  fetchAlerts = () => new Promise(resolve => { release=resolve; });
  const old = render().loadAlerts({ silent:true });
  fetchAlerts = async () => [{ id:'a', status:'Open' }];
  await render().loadAlerts({ silent:true });
  release([{ id:'old', status:'Open' }]); await old;
  assert.equal(render().alerts[0].id,'a');
  fetchAlerts = () => new Promise(resolve => { release=resolve; });
  const delayed = render().loadAlerts({ silent:true });
  await render().resolveAlert('a');
  release([{ id:'a',status:'Open' }]); await delayed;
  assert.equal(render().alerts[0].status,'Resolved');
});

test('the actual scan retains alerts on input failure and resolves them after a successful recovery read', async () => {
  const rules = await moduleFrom('src/admin/services/alertRules.js');
  const { fetchPages } = await moduleFrom('src/admin/services/pagination.js');
  const now = new Date();
  const rows = {
    alerts: [{ id:'fault',dedupe_key:'zero_production:a',status:'active',source:'system',created_at:now.toISOString() }],
    profiles: [{ id:'a',name:'Owner',role:'owner',status:'active',created_at:now.toISOString() }],
    energy_records: Array.from({ length:1201 }, (_, i) => ({ id:i,user_id:'a',production_kwh:10,consumption_kwh:1,
      surplus_kwh:9,recorded_at:new Date(now - i*86_400_000).toISOString(),is_simulated:false })),
    transactions: [], energy_requests: [], complaints: [],
  };
  let failed = 'energy_records'; const pages = [];
  const supabase = { from(table) {
    const filters = []; let patch;
    const selected = () => rows[table].filter(row => filters.every(f => f(row)));
    const query = {
      select() { return query; }, order() { return query; },
      eq(key,value) { filters.push(row => row[key] === value); return query; },
      neq(key,value) { filters.push(row => row[key] !== value); return query; },
      not(key,_op,value) { filters.push(row => row[key] != value); return query; },
      in(key,values) { filters.push(row => values.includes(row[key])); return query; },
      update(value) { patch=value; return query; },
      async insert(value) { rows[table].push({ ...value,id:'new' }); return {}; },
      async range(start,end) {
        pages.push([table,start]);
        return table === failed ? { error:Error('input unavailable') } : { data:selected().slice(start,end+1) };
      },
      then(resolve,reject) {
        const data = selected(); if (patch) data.forEach(row => Object.assign(row,patch));
        return Promise.resolve({ data }).then(resolve,reject);
      },
    };
    return query;
  } };
  const source = fs.readFileSync('src/admin/services/alertScanService.js','utf8')
    .replace(/^import[^;]+;\r?\n/gm,'').replaceAll('export ','');
  const scan = new Function('supabase','toUIStatus','toDBSeverity','runChecks','shouldRaise','recoveredAlertIds','fetchPages',
    source+';return scanForSystemAlerts;')(supabase, value => value === 'active' ? 'Active' : value,
    value => value.toLowerCase(),rules.runChecks,rules.shouldRaise,rules.recoveredAlertIds,fetchPages);
  let result = await scan();
  assert.equal(result.resolved,0); assert.equal(rows.alerts[0].status,'active');
  assert(result.failedChecks.some(c => c.check === 'member_energy'));
  failed = null;
  result = await scan(); assert.equal(result.resolved,1); assert.equal(result.raised,0);
  assert.equal(rows.alerts[0].status,'resolved'); assert.equal(rows.alerts[0].auto_resolved,true);
  assert(pages.some(([table,start]) => table === 'energy_records' && start === 1000));
  failed = 'alerts';
  await assert.rejects(scan(),/input unavailable/);
});

test('database enforces audited immutable reversal, protected system alerts and event recovery', async () => {
  const db = new PGlite();
  const admin = '11111111-1111-4111-8111-111111111111';
  const owner = '22222222-2222-4222-8222-222222222222';
  const tx = '33333333-3333-4333-8333-333333333333';
  const complaint = '44444444-4444-4444-8444-444444444444';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table profiles(id uuid primary key,name text,role text,status text);
      create function is_admin() returns boolean language sql security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
      create table alerts(id uuid primary key default gen_random_uuid(),alert_type text,user_id uuid,message text,severity text,source text,status text default 'active',dedupe_key text,created_at timestamptz default now());
      alter table alerts enable row level security;
      create policy admin_write_alerts on alerts for all using(is_admin()) with check(is_admin());
      create table transactions(id uuid primary key,sender_id uuid,receiver_id uuid,energy_amount numeric,status text,reference_code text);
      alter table transactions enable row level security;
      create policy admin_read_all_transactions on transactions for select using(is_admin());
      create policy admin_update_transaction_status on transactions for update using(is_admin());
      create table energy_requests(id bigint primary key,status text);
      create table complaints(id uuid primary key,user_id uuid,type text,status text);
      insert into profiles values('${admin}','Admin','admin','active'),('${owner}','Owner','owner','pending_approval');
      insert into transactions values('${tx}','${owner}','${admin}',2,'COMPLETED','TXN-TEST');
      insert into energy_requests values(1,'PENDING');
      grant usage on schema public,auth to authenticated,anon;
      grant select,insert,update,delete on alerts,transactions to authenticated;
    `);
    await db.exec(fs.readFileSync('database/supabase/migrations/20261010120000_admin_alert_lifecycle.sql','utf8'));
    await db.exec(`create trigger trg_complaint_alert after insert on complaints for each row execute function raise_complaint_alert();
      insert into complaints values('${complaint}','${owner}','System Fault','open');
      insert into alerts(alert_type,user_id,source,dedupe_key) values
      ('request_pending','${owner}','system','request_pending:1'),
      ('signup_pending','${owner}','system','signup_pending:${owner}'),
      ('complaint_aging','${owner}','system','complaint_aging:${complaint}'),
      ('large_transaction','${owner}','system','large_transaction:${tx}');
      set role authenticated;select set_config('request.jwt.claim.sub','${owner}',false);`);
    await assert.rejects(db.query('select admin_reverse_transaction($1,$2)',[tx,'Incorrect duplicate trade']), /admin account/);
    await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);`);
    await assert.rejects(db.query("update transactions set status='REVERSED'"), /permission denied/);
    await assert.rejects(db.query('select admin_reverse_transaction($1,$2)',[tx,'short']), /10 to 500/);
    const read = await db.query('select (admin_reverse_transaction($1,$2)).*',[tx,'Incorrect duplicate trade']);
    assert.equal(read.rows[0].reversed_by, admin);
    assert(read.rows[0].reversed_at);
    await db.query('select admin_reverse_transaction($1,$2)',[tx,'Retry with another reason']);
    let alerts = (await db.query("select * from alerts where alert_type='transaction_reversed'")).rows;
    assert.equal(alerts.length,1); assert.equal(alerts[0].status,'resolved'); assert.equal(alerts[0].auto_resolved,true);
    assert.match(alerts[0].message,/Admin.*Incorrect duplicate trade/);
    assert.equal((await db.query("delete from alerts where source='system' returning id")).rows.length,0);
    await assert.rejects(db.query("update alerts set source='admin' where source='system'"), /contents cannot/);
    await db.exec(`reset role;select set_config('request.jwt.claim.sub','${admin}',false);`);
    await assert.rejects(db.query("update transactions set status='COMPLETED'"), /reverse a completed/);
    await assert.rejects(db.query("update transactions set energy_amount=20"), /reverse a completed/);
    await db.exec(`update energy_requests set status='COMPLETED';update profiles set status='active' where id='${owner}';
      update complaints set status='under_review';`);
    assert.equal((await db.query("select status from alerts where alert_type='complaint_new'")).rows[0].status,'resolved');
    assert.equal((await db.query("select status from alerts where alert_type='complaint_aging'")).rows[0].status,'active');
    await db.exec("update complaints set status='resolved';");
    assert.equal((await db.query("select count(*)::int n from alerts where status='active'")).rows[0].n,0);
    await db.exec(`insert into alerts(alert_type,source,status,created_at) values('zero_production','system','active',now()-interval '5 days');
      set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false);
      update alerts set status='resolved',auto_resolved=false where alert_type='zero_production';`);
    alerts = (await db.query("select * from alerts where alert_type='zero_production'")).rows;
    assert(new Date(alerts[0].resolved_at) > new Date(alerts[0].created_at));
    await db.exec("update alerts set status='active' where alert_type='zero_production';");
    assert.equal((await db.query("select resolved_at from alerts where alert_type='zero_production'")).rows[0].resolved_at,null);
  } finally { await db.close(); }
});
