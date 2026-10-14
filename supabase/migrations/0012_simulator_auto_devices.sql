-- Apply after 0011. Provision virtual hardware when a household profile is created
-- or changes member role. Operator edits survive unrelated profile updates.
begin;
create or replace function simulator_private.sync_profile_device() returns trigger
language plpgsql security definer set search_path = '' as $$
declare capacity numeric; panels int; f record;
begin
  if tg_op='UPDATE' and old.role is not distinct from new.role then return new; end if;
  if tg_op='UPDATE' then
    -- A role change must not leave an old inverter fault or technician job open.
    for f in select df.job_id from public.device_faults df
      where df.household_user_id=new.id and df.status='open' loop
      insert into simulator_private.operator_closures values(f.job_id,txid_current()) on conflict(job_id) do update set transaction_id=excluded.transaction_id;
      update public.jobs set status='completed',resolution_notes='Simulator device changed with household role' where id=f.job_id and status<>'completed';
      delete from simulator_private.operator_closures where job_id=f.job_id;
    end loop;
  end if;
  if new.role not in ('owner','consumer') or new.role is null then
    delete from public.sim_devices where household_user_id=new.id;
    return new;
  end if;
  capacity := case when new.role='owner' then least(100,greatest(0,coalesce(nullif(to_jsonb(new)->>'solar_capacity_kw','')::numeric,4))) else 0 end;
  panels := case when capacity>0 then least(200,greatest(1,ceil(capacity/0.4)::int)) else 0 end;
  insert into public.sim_devices(household_user_id,inverter_serial,capacity_kw,panel_count,string_count,panel_health)
    values(new.id,'SC-INV-'||upper(left(new.id::text,8)),capacity,panels,case when panels>=2 then 2 else 1 end,array_fill(1::numeric,array[panels]))
  on conflict(household_user_id) do update set capacity_kw=excluded.capacity_kw,panel_count=excluded.panel_count,
    string_count=excluded.string_count,panel_health=excluded.panel_health,status='online',active_fault_id=null,updated_at=now();
  insert into public.sim_events(kind,household_user_id,message) values('device_provisioned',new.id,'Virtual device created for '||coalesce(new.name,'household'));
  return new;
end $$;
revoke all on function simulator_private.sync_profile_device() from public,anon,authenticated;
drop trigger if exists trg_profile_sim_device on public.profiles;
create trigger trg_profile_sim_device after insert or update of role on public.profiles
  for each row execute function simulator_private.sync_profile_device();

-- Existing households are provisioned once; existing customized devices are kept.
insert into public.sim_devices(household_user_id,inverter_serial,capacity_kw,panel_count,string_count,panel_health)
select id,'SC-INV-'||upper(left(id::text,8)),capacity,panels,
  case when panels>=2 then 2 else 1 end,array_fill(1::numeric,array[panels])
from (
  select id,capacity,case when capacity>0 then least(200,greatest(1,ceil(capacity/0.4)::int)) else 0 end panels
  from (
    select id,case when role='owner' then least(100,greatest(0,coalesce(nullif(to_jsonb(p)->>'solar_capacity_kw','')::numeric,4))) else 0 end capacity
    from public.profiles p where role in ('owner','consumer')
  ) capacities
) arrays on conflict(household_user_id) do nothing;
notify pgrst,'reload schema';
commit;
