-- User approved these nine requester-only synthetic readings on 4 October.
-- Run this ENTIRE file as ONE statement in Supabase SQL Editor (postgres role).
-- If a previous attempt errored, first run ROLLBACK; in the editor.
-- Refuses creation unless exactly one named profile exists with NO readings.
-- surplus_kwh is GENERATED: omit it from INSERT and let the database compute it.
-- Production never exceeds consumption. Existing readings/trades are untouched.

with clock as (
  select statement_timestamp() as captured_now,
    date_trunc('day', timezone('Asia/Colombo', statement_timestamp()))
      at time zone 'Asia/Colombo' as day_start
), target as (
  select p.id from public.profiles p
  where p.name = 'SolarCoop Test Requester'
    and (select count(*) from public.profiles where name = 'SolarCoop Test Requester') = 1
    and not exists (select 1 from public.energy_records r where r.user_id = p.id)
), fixtures as (
  select least(8, 2 + 2 * n)::numeric as production, (2 + 2 * n)::numeric as consumption,
    day_start - n * interval '1 day' + interval '23 hours' as recorded_at
  from clock cross join generate_series(1, 7) as days(n)
  union all
  select 2, 3, day_start + (captured_now - day_start) * 0.2 from clock
  union all
  select 6, 15, day_start + (captured_now - day_start) * 0.8 from clock
), inserted as (
  insert into public.energy_records (user_id, production_kwh, consumption_kwh, recorded_at)
  select target.id, fixtures.production, fixtures.consumption, fixtures.recorded_at
  from target cross join fixtures
  order by fixtures.recorded_at, fixtures.production
  returning id, user_id, surplus_kwh
)
select 'sprint4_analytics_fixture_manifest' as check_name,
  case when count(*) = 9 then 'CREATED'
    else 'SKIPPED: account missing/ambiguous or already has readings' end as result,
  min(user_id::text) as user_id,
  coalesce(array_agg(id order by id), array[]::bigint[]) as created_record_ids,
  max(surplus_kwh) as max_generated_surplus,
  case when count(*) = 9 then
    format('delete from public.energy_records where user_id = %L and id in (%s);',
      min(user_id::text), string_agg(id::text, ',' order by id))
  end as cleanup_sql
from inserted;

-- Save the manifest and cleanup SQL; cleanup is a separate user decision.
-- Today consumption = 15, NOT 18; seven-day average = 10;
-- comparison = 50% higher; last three completed days decrease (8 -> 6 -> 4).
-- On 4 October: generation = 24 kWh, estimated coverage = 24 / 33 * 100 = 72.7%.
-- Other execution dates shift fixtures and change month-to-date results.
-- Synthetic test data, not sensor measurements. This version has no DO block.
