-- SolarCoop — Technician Portal demo jobs (SOL-194)
-- Seed: supabase/seed/technician_demo_jobs.sql
--
-- DEMO DATA ONLY. Run in the Supabase SQL Editor after 0006_technician_jobs.sql
-- so the dashboard tabs aren't empty before a real fault is reported.
--
-- Attaches jobs to the first three consumer/owner profiles (by name), so the
-- household side of each job is a real account you can sign in as to see the
-- consumer alert card. Sites, distances and devices are made-up sample values.
--
--   member 1 → urgent Solis F05 fault (pending) + two completed history jobs
--   member 2 → medium Huawei string fault (pending)
--   member 3 → medium SolarPlanet sync delay (pending)
--
-- Re-running adds another copy; delete demo rows first with:
--   delete from public.jobs where source = 'manual' and title in
--     ('Solis Inverter Fault - 5kW','Huawei PV String Low Voltage',
--      'SolarPlanet Cloud Sync Delay','Battery Replacement','DC Fuse Fixed');

do $$
declare
  m uuid[];
begin
  select array_agg(id order by name) into m
  from (
    select id, name from public.profiles
    where role in ('consumer', 'owner')
    order by name
    limit 3
  ) p;

  if m is null or array_length(m, 1) < 3 then
    raise exception 'Need at least 3 consumer/owner profiles to seed demo jobs (found %).',
      coalesce(array_length(m, 1), 0);
  end if;

  insert into public.jobs (
    household_user_id, client_name, client_phone, site_address, site_area, distance_km,
    title, device, error_code, error_message, fault_location, urgency,
    diagnostic_checklist, consumer_message, source
  )
  select m[1], p.name, p.mobile_number,
         'No. 12, Siddhalepa Mawatha, Athurugiriya', 'Athurugiriya', 4.2,
         'Solis Inverter Fault - 5kW', 'Solis 5kW Single Phase', 'F05',
         'DC Arc Fault on String 2', 'String 2', 'urgent',
         '[{"label":"Test DC voltage","done":false},{"label":"Inspect MC4 joints","done":false},{"label":"Check isolator switch","done":false}]'::jsonb,
         'Your system is safe. A routine maintenance check is scheduled and a technician will visit soon.',
         'manual'
  from public.profiles p where p.id = m[1]
  union all
  select m[2], p.name, p.mobile_number,
         '45/3, New Kandy Road, Malabe', 'Malabe', 7.8,
         'Huawei PV String Low Voltage', 'Huawei SUN2000 3kW', 'LV-2',
         'String voltage below threshold', 'String 1', 'medium',
         '[{"label":"Measure string open-circuit voltage","done":false},{"label":"Inspect panels for shading or soiling","done":false},{"label":"Check string fuse","done":false}]'::jsonb,
         'Your panels are producing a little less than usual. A technician will take a look — no action needed from you.',
         'manual'
  from public.profiles p where p.id = m[2]
  union all
  select m[3], p.name, p.mobile_number,
         '8, Temple Road, Koswatta', 'Koswatta', 2.7,
         'SolarPlanet Cloud Sync Delay', 'SolarPlanet Gateway', 'NET-01',
         'Telemetry upload delayed > 6h', 'Gateway', 'medium',
         '[{"label":"Check gateway Wi-Fi signal","done":false},{"label":"Power-cycle the gateway","done":false},{"label":"Confirm upload in portal","done":false}]'::jsonb,
         'Your system is running normally. We are fixing a small data-sync delay on our side.',
         'manual'
  from public.profiles p where p.id = m[3];

  -- Maintenance history for member 1 (shown on the Diagnostic Dossier timeline).
  insert into public.jobs (
    household_user_id, client_name, site_area, title, device, urgency,
    status, technician_name, resolution_notes, source, created_at, accepted_at, completed_at
  )
  select m[1], p.name, 'Athurugiriya', 'Battery Replacement', 'Battery Bank', 'low',
         'completed', 'Shereen', 'Replaced degraded battery module.', 'manual',
         '2026-02-13'::timestamptz, '2026-02-13'::timestamptz, '2026-02-14'::timestamptz
  from public.profiles p where p.id = m[1]
  union all
  select m[1], p.name, 'Athurugiriya', 'DC Fuse Fixed', 'DC Combiner', 'low',
         'completed', 'Tharaka', 'Replaced blown DC fuse on string 1.', 'manual',
         '2025-10-11'::timestamptz, '2025-10-11'::timestamptz, '2025-10-12'::timestamptz
  from public.profiles p where p.id = m[1];
end;
$$;
