-- Add aggregate household feed data without exposing consumer profiles or simulator controls.
create or replace function public.technician_system_health()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'technician' and status = 'active'
  ) then
    raise exception 'An active technician account is required.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'server_time', now(),
    'community', jsonb_build_object(
      'energy', (
        select jsonb_build_object(
          'households', count(*),
          'fresh_households', count(*) filter (where fresh),
          'production_kw', sum(instant_production) filter (where fresh),
          'consumption_kw', sum(instant_consumption) filter (where fresh),
          'pool_today_kwh', sum(greatest(0, daily_production - daily_consumption)) filter (where fresh)
        ) from (
          select m.instant_production, m.instant_consumption, m.daily_production, m.daily_consumption,
            m.updated_at between now() - interval '1 minute' and now() + interval '1 minute' as fresh
          from public.sim_devices d
          join public.profiles p on p.id = d.household_user_id
          left join public.energy_metrics m on m.user_id = p.id and m.is_simulated
          where p.role in ('owner', 'consumer') and p.status = 'active'
        ) readings
      ),
      'open_faults', (
        select count(*) from public.device_faults f
        join public.sim_devices d on d.id = f.device_id
        join public.profiles p on p.id = d.household_user_id
        where f.status = 'open' and p.role = 'owner' and p.status = 'active' and d.capacity_kw > 0
      ),
      'repair_jobs', (
        select count(*) from public.jobs j
        join public.device_faults f on f.job_id = j.id and f.status = 'open'
        join public.sim_devices d on d.id = f.device_id
        join public.profiles p on p.id = d.household_user_id
        where j.status in ('pending', 'active') and p.role = 'owner' and p.status = 'active' and d.capacity_kw > 0
      )
    ),
    'systems', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'owner_name', p.name, 'household_id', p.household_id,
        'inverter_serial', d.inverter_serial, 'capacity_kw', d.capacity_kw,
        'panel_count', d.panel_count, 'device_status', d.status,
        'fault_code', f.code, 'fault_title', f.title,
        'job_id', case when j.status = 'pending' or j.technician_id = auth.uid() then j.id else null end,
        'last_reading_at', m.updated_at, 'production_kw', m.instant_production,
        'daily_production_kwh', m.daily_production,
        'battery_level', case when d.battery_kwh > 0 then m.battery_level else null end,
        'source', 'simulator'
      ) order by d.inverter_serial)
      from public.sim_devices d
      join public.profiles p on p.id = d.household_user_id
      left join public.energy_metrics m on m.user_id = d.household_user_id and m.is_simulated
      left join public.device_faults f on f.id = d.active_fault_id and f.status = 'open'
      left join public.jobs j on j.id = f.job_id and j.status in ('pending', 'active')
      where p.role = 'owner' and p.status = 'active' and d.capacity_kw > 0
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.technician_system_health() from public, anon, authenticated;
grant execute on function public.technician_system_health() to authenticated;
notify pgrst, 'reload schema';
