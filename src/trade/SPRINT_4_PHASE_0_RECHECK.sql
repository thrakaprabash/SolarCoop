-- Supabase SQL Editor: choose postgres, select ALL this text, then Run ONCE.
-- Share the phase0_recheck row. If an error occurs, run ROLLBACK;.
-- Read-only transaction; identity/role settings disappear on rollback.
begin read only;
set local statement_timeout = '30s';
set local role authenticated;
set local "request.jwt.claim.sub" = 'f46fac2b-1ef7-40ce-87f5-2bbad6bc1c90';
set local "request.jwt.claims" = '{"sub":"f46fac2b-1ef7-40ce-87f5-2bbad6bc1c90","role":"authenticated"}';

with own_records as (
  select id, production_kwh, consumption_kwh, surplus_kwh, recorded_at,
    (recorded_at at time zone 'Asia/Colombo')::date as colombo_day
  from public.energy_records where user_id = auth.uid()
), samples as (
  select * from own_records order by recorded_at desc, id desc limit 20
), days as (
  select colombo_day, count(*) as rows_in_day,
    min(production_kwh) as min_production, max(production_kwh) as max_production,
    min(consumption_kwh) as min_consumption, max(consumption_kwh) as max_consumption,
    count(*) filter (where production_kwh < 0 or consumption_kwh < 0) as negative_values
  from own_records group by colombo_day order by colombo_day desc limit 14
), rpc as (
  select name, to_regprocedure(name) is not null as exists,
    case when to_regprocedure(name) is not null then
      has_function_privilege('authenticated', name, 'EXECUTE') end as member_can_execute,
    case when to_regprocedure(name) is not null then
      has_function_privilege('anon', name, 'EXECUTE') end as anon_can_execute
  from (values ('public.trade_available_providers()'),
    ('public.trade_approve_request(bigint)'), ('public.trade_reject_request(bigint)')) f(name)
)
select 'phase0_recheck' as check_name, current_user as effective_role,
  auth.uid() = 'f46fac2b-1ef7-40ce-87f5-2bbad6bc1c90'::uuid as provider_selected,
  public.is_admin() as admin_access,
  exists(select 1 from public.transactions
    where id = 'e3bed65b-5b06-41ce-870e-330558931bec'
      and sender_id = auth.uid()) as saved_trade_provider_matches,
  (select count(*) from own_records) as own_record_count,
  (select min(recorded_at) from own_records) as earliest,
  (select max(recorded_at) from own_records) as latest,
  (select coalesce(jsonb_agg(to_jsonb(s) order by recorded_at desc, id desc), '[]'::jsonb)
    from samples s) as latest_records,
  (select coalesce(jsonb_agg(to_jsonb(d) order by colombo_day desc), '[]'::jsonb)
    from days d) as observed_days,
  (select jsonb_agg(to_jsonb(r) order by name) from rpc r) as rpc_checks;
rollback;
