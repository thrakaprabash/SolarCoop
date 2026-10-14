-- Read-only fleet health. Simulator control tables remain private.
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
