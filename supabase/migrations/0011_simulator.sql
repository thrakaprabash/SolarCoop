-- Demo simulator. Apply after energy, alerts, trade and technician migrations through 0010.
-- Nothing runs until an administrator calls sim_set_key. Never expose a service key.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists simulator_private;
revoke all on schema simulator_private from public, anon, authenticated;

create table if not exists public.sim_config (
  id int primary key default 1 check (id = 1), access_key_hash text not null default '',
  require_key boolean not null default true, running boolean not null default false,
  mode text not null default 'demo' check (mode in ('live','demo')),
  sim_time time not null default '12:00', speed int not null default 1 check (speed in (1,10,60,360)),
  weather text not null default 'sunny' check (weather in ('sunny','partly','cloudy','rain','storm')),
  random_faults boolean not null default false,
  fault_probability numeric not null default 0.002 check (fault_probability between 0 and 0.1),
  leader_tab_id uuid, lease_until timestamptz, last_tick_id uuid,
  updated_at timestamptz not null default now()
);
insert into public.sim_config(id) values (1) on conflict do nothing;
create table if not exists public.sim_devices (
  id uuid primary key default gen_random_uuid(),
  household_user_id uuid not null unique references public.profiles(id) on delete cascade,
  inverter_serial text not null, capacity_kw numeric not null default 0 check (capacity_kw between 0 and 100),
  panel_count int not null default 0 check (panel_count between 0 and 200),
  string_count int not null default 1 check (string_count between 1 and 20),
  panel_health numeric[] not null default '{}',
  load_profile text not null default 'family' check (load_profile in ('small','family','large','business')),
  load_factor numeric not null default 1 check (load_factor between 0 and 2),
  battery_kwh numeric not null default 0 check (battery_kwh between 0 and 200),
  battery_level numeric not null default 50 check (battery_level between 0 and 100),
  status text not null default 'online' check (status in ('online','degraded','fault','offline')),
  active_fault_id uuid, updated_at timestamptz not null default now()
);
create table if not exists public.sim_fault_codes (
  code text primary key, title text not null, technical_message text not null,
  urgency text not null, severity text not null, device_status text not null, consumer_message text not null
);
insert into public.sim_fault_codes values
('E01','Inverter offline','Check AC/DC supply, isolator and inverter communications.','urgent','critical','offline','Your solar system has paused. A technician is on the way — no action needed.'),
('E02','Panel underperforming (dust/shade)','Inspect shading, contamination and panel output.','low','low','degraded','Your panels are producing a little less than usual. We have scheduled a check.'),
('E03','Grid over-voltage trip','Measure grid voltage and review inverter trip logs.','urgent','high','fault','Your system is protecting itself from a grid issue. A technician will check it.'),
('E04','Ground / insulation fault','Isolate DC supply and test insulation resistance before reconnecting.','urgent','critical','fault','For safety, your system has been switched off. Please do not touch the panels; a technician is coming.'),
('E05','Over-temperature derate','Inspect ventilation, heatsink and inverter temperature.','medium','medium','degraded','Your inverter is running warm and has slowed down a bit. We will take a look.'),
('E06','String disconnected','Check string voltage and MC4 connectors with DC isolated.','medium','high','degraded','Part of your solar array is not connected. A technician will reconnect it.'),
('E07','Meter communication lost','Check meter power and communication wiring.','medium','medium','offline','We have lost contact with your meter. A technician will check the connection.'),
('E08','Arc fault detected','Isolate the array and inspect cabling for arcing before restarting.','urgent','critical','fault','Your system detected an electrical issue and shut down safely. Help is on the way.')
on conflict (code) do nothing;
create table if not exists public.device_faults (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.sim_devices(id) on delete cascade,
  household_user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null references public.sim_fault_codes(code), title text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','resolved_by_job','resolved_manual')),
  job_id uuid references public.jobs(id), alert_id uuid references public.alerts(id),
  details jsonb not null default '{}', raised_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index if not exists device_faults_one_open on public.device_faults(device_id) where status = 'open';
create table if not exists public.sim_events (
  id bigint generated always as identity primary key, created_at timestamptz not null default now(),
  kind text not null, household_user_id uuid, message text not null, data jsonb not null default '{}'
);
alter table public.energy_records add column if not exists is_simulated boolean not null default false;
alter table public.energy_metrics add column if not exists is_simulated boolean not null default false;
alter table public.chart_data add column if not exists is_simulated boolean not null default false;
alter table public.jobs add column if not exists device_fault_id uuid;
alter table public.jobs add column if not exists is_simulated boolean not null default false;
alter table public.alerts add column if not exists is_simulated boolean not null default false;

-- Retain original singleton rows so Reset can restore real/seed data overwritten by upserts.
create table if not exists simulator_private.original_rows (
  table_name text not null, row_key text not null, value jsonb not null,
  primary key (table_name,row_key)
);
-- Only privileged simulator RPCs can insert these transaction-scoped authorizations.
create table if not exists simulator_private.operator_closures (
  job_id uuid primary key, transaction_id bigint not null
);

alter table public.sim_config enable row level security;
alter table public.sim_devices enable row level security;
alter table public.sim_fault_codes enable row level security;
alter table public.device_faults enable row level security;
alter table public.sim_events enable row level security;
revoke all on public.sim_config, public.sim_devices, public.sim_fault_codes, public.device_faults, public.sim_events from anon, authenticated;

create or replace function public.sim_set_key(p_key text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(p_key) < 12 or octet_length(p_key) > 72 then raise exception 'Choose a demo key of 12 to 72 bytes.'; end if;
  update public.sim_config set access_key_hash = crypt(p_key, gen_salt('bf',10)), require_key = true,
    running = false, leader_tab_id = null, lease_until = null, updated_at = now() where id = 1;
end $$;
revoke all on function public.sim_set_key(text) from public, anon, authenticated;

create or replace function public.sim_assert_key(p_key text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare c public.sim_config;
begin
  select * into c from public.sim_config where id = 1;
  if not found or (c.require_key and (c.access_key_hash = '' or p_key is null or octet_length(p_key)>72 or crypt(p_key,c.access_key_hash) is distinct from c.access_key_hash)) then
    raise exception 'Invalid simulator key. Add ?key=… to the URL.' using errcode = '42501';
  end if;
end $$;

create or replace function public.sim_assert_leader(p_tab_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.sim_config where id = 1 and leader_tab_id = p_tab_id and lease_until > now() for update;
  if not found then raise exception 'Another tab controls the simulator. Wait for its lease to expire.' using errcode='42501'; end if;
end $$;

create or replace function public.sim_claim_lease(p_key text, p_tab_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform public.sim_assert_key(p_key);
  if p_tab_id is null then raise exception 'Tab id required'; end if;
  update public.sim_config set leader_tab_id = p_tab_id, lease_until = now() + interval '15 seconds'
    where id = 1 and (leader_tab_id = p_tab_id or lease_until is null or lease_until <= now());
  return found;
end $$;

create or replace function public.sim_snapshot(p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.sim_assert_key(p_key);
  return jsonb_build_object(
    'config',(select to_jsonb(c) - 'access_key_hash' from public.sim_config c where id=1),
    'devices',coalesce((select jsonb_agg(to_jsonb(d) || jsonb_build_object('name',p.name,'role',p.role,'phone',p.mobile_number,
      'metrics',(select to_jsonb(m) from public.energy_metrics m where m.user_id=d.household_user_id)))
      from public.sim_devices d join public.profiles p on p.id=d.household_user_id),'[]'::jsonb),
    'faults',coalesce((select jsonb_agg(to_jsonb(f) || jsonb_build_object('job_status',j.status,'ticket_code',j.ticket_code,'technician_name',j.technician_name))
      from public.device_faults f left join public.jobs j on j.id=f.job_id where f.status='open'),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.id desc) from (select * from public.sim_events order by id desc limit 50) e),'[]'::jsonb)
  );
end $$;

create or replace function public.sim_bootstrap(p_key text, p_tab_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p record; capacity numeric; panels int;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  for p in select * from public.profiles where role in ('owner','consumer') loop
    capacity := case when p.role='owner' then least(100,greatest(0,coalesce(nullif(to_jsonb(p)->>'solar_capacity_kw','')::numeric,4))) else 0 end;
    panels := case when capacity>0 then least(200,greatest(1,ceil(capacity/0.4)::int)) else 0 end;
    insert into public.sim_devices(household_user_id,inverter_serial,capacity_kw,panel_count,string_count,panel_health)
    values (p.id,'SC-INV-'||upper(left(p.id::text,8)),capacity,panels,case when panels>=2 then 2 else 1 end,array_fill(1::numeric,array[panels])) on conflict (household_user_id) do nothing;
  end loop;
  return public.sim_snapshot(p_key);
end $$;

create or replace function public.sim_update_config(p_key text, p_tab_id uuid, p_patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  update public.sim_config set running=coalesce((p_patch->>'running')::boolean,running),
    mode=coalesce(p_patch->>'mode',mode), sim_time=coalesce((p_patch->>'sim_time')::time,sim_time),
    speed=coalesce((p_patch->>'speed')::int,speed), weather=coalesce(p_patch->>'weather',weather),
    random_faults=coalesce((p_patch->>'random_faults')::boolean,random_faults),
    fault_probability=coalesce((p_patch->>'fault_probability')::numeric,fault_probability), updated_at=now() where id=1;
  insert into public.sim_events(kind,message,data) values ('controls','Simulation controls changed',p_patch - 'access_key_hash');
end $$;

create or replace function public.sim_update_device(p_key text,p_tab_id uuid,p_device_id uuid,p_patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.sim_devices; panels int; strings int; capacity numeric;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into strict d from public.sim_devices where id=p_device_id for update;
  panels := coalesce((p_patch->>'panel_count')::int,d.panel_count);
  strings := coalesce((p_patch->>'string_count')::int,d.string_count);
  capacity := coalesce((p_patch->>'capacity_kw')::numeric,d.capacity_kw);
  if d.active_fault_id is not null and p_patch ?| array['panel_count','string_count','capacity_kw'] then raise exception 'Clear the fault before changing the array.'; end if;
  if (panels>0 and strings>panels) or (capacity>0 and panels=0) then raise exception 'Producing devices need panels; strings cannot exceed panels.'; end if;
  if exists(select 1 from public.profiles where id=d.household_user_id and role='consumer') and (capacity>0 or panels>0) then raise exception 'Consumers have no solar array.'; end if;
  update public.sim_devices set capacity_kw=capacity,panel_count=panels,string_count=strings,
    panel_health=case when panels<>d.panel_count then array_fill(1::numeric,array[panels]) else panel_health end,
    load_profile=coalesce(p_patch->>'load_profile',load_profile),load_factor=coalesce((p_patch->>'load_factor')::numeric,load_factor),
    battery_kwh=coalesce((p_patch->>'battery_kwh')::numeric,battery_kwh),
    battery_level=coalesce((p_patch->>'battery_level')::numeric,battery_level),updated_at=now() where id=p_device_id;
end $$;

create or replace function public.raise_job_from_device_fault() returns trigger
language plpgsql security definer set search_path = '' as $$
declare fc public.sim_fault_codes; p public.profiles; d public.sim_devices; j uuid; a uuid;
begin
  select * into strict fc from public.sim_fault_codes where code=new.code;
  select * into strict p from public.profiles where id=new.household_user_id;
  select * into strict d from public.sim_devices where id=new.device_id;
  insert into public.jobs(household_user_id,client_name,client_phone,title,device,error_code,error_message,urgency,consumer_message,source,device_fault_id,is_simulated,fault_location)
    values(p.id,p.name,p.mobile_number,fc.title,d.inverter_serial,fc.code,fc.technical_message,fc.urgency,fc.consumer_message,'telemetry',new.id,true,
      case when new.code='E06' then 'String '||(new.details->>'string') else 'Virtual inverter' end) returning id into j;
  insert into public.alerts(alert_type,user_id,message,severity,status,source,dedupe_key,is_simulated)
    values('device_fault',p.id,fc.code||' — '||fc.title||' at '||coalesce(p.name,'household')||'. '||fc.technical_message,fc.severity,'active','system','device_fault:'||d.id,true) returning id into a;
  update public.device_faults set job_id=j,alert_id=a where id=new.id;
  update public.sim_devices set status=fc.device_status,active_fault_id=new.id,updated_at=now(),
    panel_health=case when new.code='E06' then array(select case when floor((i-1)::numeric*string_count/panel_count)+1=(new.details->>'string')::int then 0 else panel_health[i] end from generate_series(1,panel_count) i) else panel_health end where id=d.id;
  insert into public.sim_events(kind,household_user_id,message,data) values
    ('fault_raised',p.id,fc.code||' raised at '||coalesce(p.name,'household'),jsonb_build_object('job_id',j,'fault_id',new.id)),
    ('job_created',p.id,'Technician job created',jsonb_build_object('job_id',j));
  return new;
end $$;
drop trigger if exists trg_device_fault_job on public.device_faults;
create trigger trg_device_fault_job after insert on public.device_faults for each row execute function public.raise_job_from_device_fault();

create or replace function public.sim_inject_fault(p_key text,p_tab_id uuid,p_device_id uuid,p_code text,p_details jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.sim_devices; fc public.sim_fault_codes; f uuid;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into strict d from public.sim_devices where id=p_device_id for update;
  select * into strict fc from public.sim_fault_codes where code=p_code;
  if d.capacity_kw=0 then raise exception 'Consumer-only households have no inverter to fault.'; end if;
  if jsonb_typeof(p_details) is distinct from 'object' then raise exception 'Fault details must be an object'; end if;
  if p_code='E06' and (coalesce((p_details->>'string')::int,0)<1 or (p_details->>'string')::int>d.string_count) then raise exception 'Choose a valid string'; end if;
  insert into public.device_faults(device_id,household_user_id,code,title,severity,details) values(d.id,d.household_user_id,fc.code,fc.title,fc.severity,p_details) returning id into f;
  return (select to_jsonb(x) from public.device_faults x where id=f);
end $$;

create or replace function public.clear_fault_on_job_completed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare f public.device_faults;
begin
  if new.device_fault_id is null then return new; end if;
  if new.status='active' and old.status is distinct from 'active' then
    insert into public.sim_events(kind,household_user_id,message,data) values('job_accepted',new.household_user_id,coalesce(new.technician_name,'Technician')||' accepted '||new.ticket_code,jsonb_build_object('job_id',new.id));
  elsif new.status='completed' and old.status is distinct from 'completed' then
    update public.device_faults set status=case when exists(select 1 from simulator_private.operator_closures where job_id=new.id and transaction_id=txid_current()) then 'resolved_manual' else 'resolved_by_job' end,resolved_at=now()
      where id=new.device_fault_id and status='open' returning * into f;
    if found then
      update public.sim_devices set status='online',active_fault_id=null,panel_health=array_fill(1::numeric,array[panel_count]),updated_at=now() where id=f.device_id and active_fault_id=f.id;
      update public.alerts set status='resolved' where id=f.alert_id;
      insert into public.sim_events(kind,household_user_id,message,data) values('fault_cleared',new.household_user_id,'Fault cleared — '||new.ticket_code||' completed',jsonb_build_object('job_id',new.id));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_job_completed_clear_fault on public.jobs;
create trigger trg_job_completed_clear_fault after update of status on public.jobs for each row execute function public.clear_fault_on_job_completed();

create or replace function public.sim_clear_fault(p_key text,p_tab_id uuid,p_device_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.device_faults;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into f from public.device_faults where device_id=p_device_id and status='open' for update;
  if not found then return; end if;
  insert into simulator_private.operator_closures values(f.job_id,txid_current()) on conflict(job_id) do update set transaction_id=excluded.transaction_id;
  update public.jobs set status='completed',resolution_notes='Cleared from simulator' where id=f.job_id and status<>'completed';
  delete from simulator_private.operator_closures where job_id=f.job_id;
end $$;

create or replace function simulator_private.number(p_row jsonb,p_field text,p_max numeric) returns numeric
language plpgsql set search_path = '' as $$
declare n numeric;
begin
  n := (p_row->>p_field)::numeric;
  if n is null or not (n>=0 and n<=p_max) then raise exception 'Invalid reading: %',p_field; end if;
  return n;
end $$;

create or replace function simulator_private.refresh_history(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r text; days int;
begin
  foreach r in array array['week','month'] loop
    days:=case when r='week' then 7 else 30 end;
    insert into simulator_private.original_rows select 'chart_data',c.id::text,to_jsonb(c) from public.chart_data c where user_id=p_user and range=r and not is_simulated on conflict do nothing;
    insert into public.chart_data(user_id,range,hours,production,consumption,surplus,deficit,is_simulated,updated_at)
    select p_user,r,array_agg(to_char(day,'MM/DD') order by day),array_agg(prod order by day),array_agg(cons order by day),array_agg(greatest(0,prod-cons) order by day),array_agg(greatest(0,cons-prod) order by day),true,now()
    from (
      select day,coalesce(e.production_kwh,0) prod,coalesce(e.consumption_kwh,0) cons
      from generate_series((now() at time zone 'Asia/Colombo')::date-(days-1),(now() at time zone 'Asia/Colombo')::date,interval '1 day') day
      left join lateral(select production_kwh,consumption_kwh from public.energy_records where user_id=p_user and (recorded_at at time zone 'Asia/Colombo')::date=day::date order by recorded_at desc,id desc limit 1) e on true
    ) points
    on conflict(user_id,range) do update set hours=excluded.hours,production=excluded.production,consumption=excluded.consumption,surplus=excluded.surplus,deficit=excluded.deficit,is_simulated=true,updated_at=now();
  end loop;
end $$;

create or replace function public.sim_push_tick(p_key text,p_tab_id uuid,p_tick_id uuid,p_batch jsonb,p_sim_time time) returns void
language plpgsql security definer set search_path = '' as $$
declare r jsonb; d public.sim_devices; f text; prod numeric; cons numeric; dp numeric; dc numeric; level numeric; flow numeric;
  slot int; n int; pool numeric; capacity numeric; online int; traded numeric;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_tick_id is null then raise exception 'Tick id required'; end if;
  if (select last_tick_id=p_tick_id from public.sim_config where id=1) then return; end if;
  if jsonb_typeof(p_batch) is distinct from 'array' or jsonb_array_length(p_batch)>500 then raise exception 'Expected up to 500 device readings'; end if;
  select count(distinct v->>'device_id') into n from jsonb_array_elements(p_batch) v;
  if n<>jsonb_array_length(p_batch) then raise exception 'Duplicate device readings'; end if;
  select coalesce(sum(capacity_kw),0),count(*) filter(where status in ('online','degraded')) into capacity,online from public.sim_devices;
  select coalesce(sum(greatest(0,(x->>'daily_production')::numeric-(x->>'daily_consumption')::numeric)),0) into pool from jsonb_array_elements(p_batch) x;
  for r in select * from jsonb_array_elements(p_batch) loop
    select * into strict d from public.sim_devices where id=(r->>'device_id')::uuid for update;
    select code into f from public.device_faults where device_id=d.id and status='open';
    if f='E07' then continue; end if;
    prod:=simulator_private.number(r,'instant_production',103); cons:=simulator_private.number(r,'instant_consumption',100);
    dp:=simulator_private.number(r,'daily_production',100000); dc:=simulator_private.number(r,'daily_consumption',100000);
    level:=simulator_private.number(r,'battery_level',100); flow:=(r->>'battery_power_flow')::numeric;
    if flow is null or not(flow between -103 and 103) then raise exception 'Invalid battery flow'; end if;
    if prod>d.capacity_kw*1.031 then raise exception 'Production exceeds inverter capacity'; end if;
    if f in ('E01','E04','E08') then prod:=0; end if;
    select coalesce(sum(energy_amount),0) into traded from public.transactions where sender_id=d.household_user_id and status='COMPLETED' and created_at >= date_trunc('day',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';
    insert into simulator_private.original_rows select 'energy_metrics',m.id::text,to_jsonb(m) from public.energy_metrics m where user_id=d.household_user_id and not is_simulated on conflict do nothing;
    insert into public.energy_metrics(user_id,instant_production,instant_consumption,daily_production,daily_consumption,battery_level,battery_capacity,battery_power_flow,surplus_available,coop_pool_shared_today,coop_members_online,coop_total_capacity,coop_tokens_earned,monetary_saved,co2_saved_kg,grid_independence,is_simulated,updated_at)
    values(d.household_user_id,prod,cons,dp,dc,round(level)::int,d.battery_kwh,flow,greatest(0,dp-dc-traded),pool,online,capacity,greatest(0,dp-dc)*0.22,least(dp,dc)*0.22,dp*0.82,case when dc=0 then 0 else least(100,round(dp/dc*100))::int end,true,now())
    on conflict(user_id) do update set instant_production=excluded.instant_production,instant_consumption=excluded.instant_consumption,daily_production=dp,daily_consumption=dc,battery_level=excluded.battery_level,battery_capacity=d.battery_kwh,battery_power_flow=flow,surplus_available=excluded.surplus_available,coop_pool_shared_today=pool,coop_members_online=online,coop_total_capacity=capacity,coop_tokens_earned=excluded.coop_tokens_earned,monetary_saved=excluded.monetary_saved,co2_saved_kg=excluded.co2_saved_kg,grid_independence=excluded.grid_independence,is_simulated=true,updated_at=now();
    update public.sim_devices set battery_level=level where id=d.id;
    if coalesce((r->>'write_record')::boolean,false) then
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,surplus_kwh,recorded_at,is_simulated) values(d.household_user_id,dp,dc,greatest(0,dp-dc-traded),now(),true);
      slot := (r->>'slot')::int+1;
      if slot is null or slot not between 1 and 12 then raise exception 'Invalid chart slot'; end if;
      insert into simulator_private.original_rows select 'chart_data',c.id::text,to_jsonb(c) from public.chart_data c where user_id=d.household_user_id and range='day' and not is_simulated on conflict do nothing;
      insert into public.chart_data(user_id,range,hours,production,consumption,surplus,deficit,is_simulated)
        values(d.household_user_id,'day',array['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),true)
      on conflict(user_id,range) do update set
        hours=excluded.hours,
        production=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.production else public.chart_data.production end,
        consumption=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.consumption else public.chart_data.consumption end,
        surplus=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.surplus else public.chart_data.surplus end,
        deficit=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.deficit else public.chart_data.deficit end,is_simulated=true;
      update public.chart_data set production[slot]=prod,consumption[slot]=cons,surplus[slot]=greatest(0,prod-cons),deficit[slot]=greatest(0,cons-prod),updated_at=now() where user_id=d.household_user_id and range='day';
      if coalesce((r->>'rollover')::boolean,false) then perform simulator_private.refresh_history(d.household_user_id); end if;
    end if;
  end loop;
  update public.sim_config set sim_time=p_sim_time,last_tick_id=p_tick_id,updated_at=now() where id=1;
  delete from public.sim_events where id < (select coalesce(max(id),0)-1000 from public.sim_events);
end $$;

create or replace function public.sim_backfill(p_key text,p_tab_id uuid,p_days int) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.sim_devices; day date; prod numeric; cons numeric; i int;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_days not in (7,30) or p_days is null then raise exception 'Backfill supports 7 or 30 days'; end if;
  for d in select * from public.sim_devices loop
    for i in 1..p_days loop
      day := (now() at time zone 'Asia/Colombo')::date-i;
      prod:=d.capacity_kw*(4+0.5*sin(i));
      cons:=case d.load_profile when 'small' then 12.1 when 'large' then 30 when 'business' then 37.6 else 20.2 end*d.load_factor;
      delete from public.energy_records where user_id=d.household_user_id and is_simulated and (recorded_at at time zone 'Asia/Colombo')::date=day;
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,surplus_kwh,recorded_at,is_simulated) values(d.household_user_id,prod,cons,greatest(0,prod-cons),(day+time '23:59:00') at time zone 'Asia/Colombo',true);
    end loop;
    perform simulator_private.refresh_history(d.household_user_id);
  end loop;
  insert into public.sim_events(kind,message) values('backfill',p_days||' days of history generated');
end $$;

create or replace function public.sim_reset(p_key text,p_tab_id uuid,p_scope text default 'data') returns void
language plpgsql security definer set search_path = '' as $$
declare d record; r record;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_scope is null or p_scope not in ('data','all') then raise exception 'Reset scope must be data or all'; end if;
  update public.sim_config set running=false,last_tick_id=null where id=1;
  for d in select device_id from public.device_faults where status='open' loop perform public.sim_clear_fault(p_key,p_tab_id,d.device_id); end loop;
  delete from public.energy_records where is_simulated;
  delete from public.energy_metrics where is_simulated;
  delete from public.chart_data where is_simulated;
  for r in select * from simulator_private.original_rows loop
    if r.table_name='energy_metrics' then insert into public.energy_metrics select (jsonb_populate_record(null::public.energy_metrics,r.value)).* on conflict(user_id) do nothing;
    else insert into public.chart_data select (jsonb_populate_record(null::public.chart_data,r.value)).* on conflict(user_id,range) do nothing; end if;
  end loop;
  delete from simulator_private.original_rows;
  update public.sim_devices set battery_level=50;
  if p_scope='all' then
    delete from public.device_faults;
    delete from public.jobs where is_simulated;
    delete from public.alerts where is_simulated;
    delete from public.sim_devices;
    delete from public.sim_events;
  end if;
  insert into public.sim_events(kind,message) values('reset','Simulator reset ('||p_scope||')');
end $$;

create or replace function public.record_job_closure()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- A transaction-scoped marker can only be created by key-checked simulator RPCs.
  if old.status <> 'completed' and new.status = 'completed' and old.is_simulated
     and old.device_fault_id is not null and exists (
       select 1 from simulator_private.operator_closures
       where job_id = old.id and transaction_id = txid_current()
     ) then
    new.completed_at := now();
    new.consumer_message := 'The simulator operator cleared this fault.';
    new.closure_record := jsonb_build_object('source','simulator','notes',new.resolution_notes,
      'completedAt',new.completed_at,'checklist',old.diagnostic_checklist,'photos',old.repair_photos,
      'technicianId',old.technician_id,'technicianName',old.technician_name);
    return new;
  end if;
  -- Allow the existing ON DELETE SET NULL foreign key to unlink a removed profile;
  -- the technician identity remains in the permanent closure snapshot.
  if old.status = 'completed' then
    if new.status is distinct from old.status
       or new.closure_record is distinct from old.closure_record
       or new.repair_photos is distinct from old.repair_photos
       or new.diagnostic_checklist is distinct from old.diagnostic_checklist
       or new.resolution_notes is distinct from old.resolution_notes
       or (new.technician_id is distinct from old.technician_id and not (
         new.technician_id is null and not exists (select 1 from public.profiles where id = old.technician_id)
       ))
       or new.technician_name is distinct from old.technician_name
       or new.completed_at is distinct from old.completed_at then
      raise exception 'Completed repair records cannot be changed.';
    end if;
    return new;
  end if;

  if new.status = 'completed' then
    if old.status <> 'active' or not public.is_technician()
       or auth.uid() is distinct from old.technician_id then
      raise exception 'Only the assigned technician can close an active job.';
    end if;
    if char_length(btrim(coalesce(new.resolution_notes, ''))) < 10
       or char_length(new.resolution_notes) > 500 then
      raise exception 'Write 10 to 500 characters describing the repair before closing.';
    end if;
    if jsonb_array_length(old.repair_photos) = 0 then
      raise exception 'Add at least one repair photo before closing this job.';
    end if;
    if exists (
      select 1 from jsonb_array_elements(old.repair_photos) p
      where not exists (
        select 1 from storage.objects o
        where o.bucket_id = 'repair-evidence' and o.name = p->>'path'
          and split_part(o.name, '/', 1) = old.id::text
          and o.metadata->>'mimetype' in ('image/jpeg', 'image/png')
          and (o.metadata->>'size')::bigint between 1 and 10485760
      )
    ) then
      raise exception 'Some repair photos are missing. Upload them again before closing.';
    end if;
    -- Never overwrite recently saved steps or evidence with an old client copy.
    new.diagnostic_checklist := old.diagnostic_checklist;
    new.repair_photos := old.repair_photos;
    new.technician_id := old.technician_id;
    new.technician_name := old.technician_name;
    new.resolution_notes := btrim(new.resolution_notes);
    new.completed_at := now();
    new.consumer_message := 'The technician has completed the repair. Thank you for your patience.';
    new.closure_record := jsonb_build_object(
      'photos', new.repair_photos, 'checklist', new.diagnostic_checklist,
      'notes', new.resolution_notes, 'completedAt', new.completed_at,
      'technicianId', new.technician_id, 'technicianName', new.technician_name
    );
  elsif new.closure_record is distinct from old.closure_record then
    raise exception 'A closure record is created only when a job is completed.';
  end if;
  return new;
end;
$$;


-- No public execute defaults, including internal helpers and trigger functions.
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and (p.proname like 'sim_%' or p.proname in ('raise_job_from_device_fault','clear_fault_on_job_completed')) loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    if f.proname in ('sim_snapshot','sim_claim_lease','sim_bootstrap','sim_update_config','sim_update_device','sim_push_tick','sim_inject_fault','sim_clear_fault','sim_backfill','sim_reset') then
      execute format('grant execute on function %s to anon, authenticated',f.signature);
    end if;
  end loop;
end $$;
do $$ declare t text; begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['sim_devices','device_faults','sim_events','energy_metrics'] loop
      if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end loop;
  end if;
end $$;
-- Anonymous readers use key-checked snapshot polling: no public SELECT policy or PII broadcast.
notify pgrst, 'reload schema';
commit;
