-- PROPOSED LIVE TEST FIXTURES. Requires the user's approval before running.
-- Run as postgres in Supabase SQL Editor. This CREATES nine readings for the
-- existing SolarCoop Test Requester only; it does not overwrite any reading.
-- All surplus values are zero so these fixtures add no tradeable energy.
-- If this named account already has ANY readings, the entire run aborts.
-- Save the returned IDs and cleanup SQL. Cleanup is a separate user action.
begin;

create temporary table sprint4_created_readings (id bigint, user_id uuid) on commit drop;

do $$
declare
  target_user uuid;
  matches integer;
  day_start timestamptz := date_trunc('day', timezone('Asia/Colombo', statement_timestamp())) at time zone 'Asia/Colombo';
  captured_now timestamptz := statement_timestamp();
begin
  select count(*), (array_agg(id))[1] into matches, target_user
  from public.profiles where name = 'SolarCoop Test Requester';
  if matches <> 1 then
    raise exception 'Exactly one SolarCoop Test Requester profile is required; no data created';
  end if;
  if exists (select 1 from public.energy_records where user_id = target_user) then
    raise exception 'Test requester already has readings; no data created';
  end if;

  with inserted as (
    insert into public.energy_records (user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at)
    select target_user, 8, 2 + 2 * n, 0,
      day_start - n * interval '1 day' + interval '23 hours'
    from generate_series(1, 7) as days(n)
    returning id, user_id
  ) insert into sprint4_created_readings select id, user_id from inserted;

  with inserted as (
    insert into public.energy_records (user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at)
    values
      (target_user, 2, 3, 0, day_start + (captured_now - day_start) * 0.2),
      (target_user, 6, 15, 0, day_start + (captured_now - day_start) * 0.8)
    returning id, user_id
  ) insert into sprint4_created_readings select id, user_id from inserted;
end $$;

select 'sprint4_analytics_fixture_manifest' as check_name,
  user_id, array_agg(id order by id) as created_record_ids,
  format('delete from public.energy_records where user_id = %L and id in (%s);',
    user_id::text, string_agg(id::text, ',' order by id)) as cleanup_sql
from sprint4_created_readings group by user_id;

commit;

-- At creation time, today's consumption = 15 (not 18); previous 7-day average
-- = 10 from 7 days; comparison = 50% higher; last 3 completed days decrease.
-- On 4 October: generation = 30 kWh from 4 days; estimated coverage
-- = (8 + 6 + 4 + 6) / (8 + 6 + 4 + 15) * 100 = 72.7%.
-- On other dates, month-to-date coverage/generation differ with the calendar.
-- These are synthetic test readings, not sensor measurements. Do not use
-- the manifest's deletion SQL until the user explicitly chooses cleanup.
