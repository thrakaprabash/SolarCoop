-- Repair simulator writes for the app generated surplus_kwh column.
-- Apply after 0011 and 0012. No data or authentication settings are reset.
begin;
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
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,recorded_at,is_simulated) values(d.household_user_id,dp,dc,now(),true);
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
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,recorded_at,is_simulated) values(d.household_user_id,prod,cons,(day+time '23:59:00') at time zone 'Asia/Colombo',true);
    end loop;
    perform simulator_private.refresh_history(d.household_user_id);
  end loop;
  insert into public.sim_events(kind,message) values('backfill',p_days||' days of history generated');
end $$;


-- Simulated readings are cumulative day totals. Deduct all completed sales
-- in that Colombo day, including sales before the latest simulated snapshot.
create schema if not exists trade_private;
create or replace function trade_private.available_kwh(p_provider_id uuid)
returns numeric language sql volatile security definer set search_path = '' as $$
  with latest as (
    select greatest(0::numeric,coalesce(r.surplus_kwh,r.production_kwh-r.consumption_kwh)) measured_kwh,
      r.recorded_at,r.is_simulated
    from public.energy_records r where r.user_id=p_provider_id
    order by r.recorded_at desc,r.id desc limit 1
  )
  select greatest(0::numeric,latest.measured_kwh-coalesce((
    select sum(t.energy_amount) from public.transactions t
    where t.sender_id=p_provider_id and t.status='COMPLETED'
      and case when latest.is_simulated then
        t.created_at >= date_trunc('day',latest.recorded_at at time zone 'Asia/Colombo') at time zone 'Asia/Colombo'
      else t.created_at > latest.recorded_at end
  ),0::numeric)) from latest;
$$;
revoke all on schema trade_private from public,anon;
grant usage on schema trade_private to authenticated;
revoke all on function trade_private.available_kwh(uuid) from public,anon;
grant execute on function trade_private.available_kwh(uuid) to authenticated;

notify pgrst,'reload schema';
commit;
