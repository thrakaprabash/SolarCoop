-- Phase 0 read-only inspection. Run the WHOLE script as postgres in Supabase
-- SQL Editor and share each result table. No data/policy/function is changed.
-- Uses the provider of the saved, previously authorized Sprint 3 test trade.
begin read only;
set local statement_timeout = '30s';

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('energy_records', 'energy_metrics')
order by table_name, ordinal_position;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('energy_records', 'energy_requests', 'transactions')
order by tablename, cmd, policyname;

select name,
  to_regprocedure(name) is not null as exists,
  case when to_regprocedure(name) is not null
    then has_function_privilege('authenticated', name, 'EXECUTE') end as member_can_execute,
  case when to_regprocedure(name) is not null
    then has_function_privilege('anon', name, 'EXECUTE') end as anon_can_execute
from (values ('public.trade_available_providers()'),
  ('public.trade_approve_request(bigint)'), ('public.trade_reject_request(bigint)')) rpc(name);

select indexname, indexdef from pg_indexes
where schemaname = 'public' and indexname = 'transactions_one_per_request_idx';

select set_config('request.jwt.claims', json_build_object(
  'sub', (select sender_id from public.transactions
    where id = 'e3bed65b-5b06-41ce-870e-330558931bec'),
  'role', 'authenticated')::text, true);
set local role authenticated;

select 'phase0_provider_access' as check_name, current_user as effective_role,
  auth.uid() is not null as provider_selected, public.is_admin() as admin_access,
  (select count(*) from public.energy_records where user_id = auth.uid()) as own_record_count,
  (select min(recorded_at) from public.energy_records where user_id = auth.uid()) as earliest,
  (select max(recorded_at) from public.energy_records where user_id = auth.uid()) as latest;

select id, production_kwh, consumption_kwh, surplus_kwh, recorded_at,
  (recorded_at at time zone 'Asia/Colombo')::date as colombo_day
from public.energy_records where user_id = auth.uid()
order by recorded_at desc, id desc limit 20;

-- Only the latest 14 observed dates; this does NOT declare them daily totals.
select (recorded_at at time zone 'Asia/Colombo')::date as colombo_day,
  count(*) as rows_in_day,
  min(production_kwh) as min_production, max(production_kwh) as max_production,
  min(consumption_kwh) as min_consumption, max(consumption_kwh) as max_consumption,
  count(*) filter (where production_kwh is null or consumption_kwh is null) as missing_values,
  count(*) filter (where production_kwh < 0 or consumption_kwh < 0) as negative_values
from public.energy_records where user_id = auth.uid()
group by colombo_day order by colombo_day desc limit 14;

select 'phase0_saved_trade' as check_name, status, energy_amount, reference_code
from public.transactions
where id = 'e3bed65b-5b06-41ce-870e-330558931bec';
rollback;
