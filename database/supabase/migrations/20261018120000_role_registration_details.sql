-- Apply this complete file in the Supabase SQL Editor, or use the repository's
-- managed migration workflow. Existing users may complete details in Profile.
begin;

-- Lightweight preflight so the new app cannot silently register against an
-- older schema which would discard the extra fields.
create or replace function public.registration_details_version()
returns integer language sql immutable as $$ select 2 $$;
revoke all on function public.registration_details_version() from public;
grant execute on function public.registration_details_version() to anon, authenticated;

create table if not exists public.household_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  address text not null check (length(trim(address)) between 1 and 300),
  district text not null,
  city text not null check (length(trim(city)) between 1 and 100),
  monthly_consumption_kwh numeric check (monthly_consumption_kwh between 0 and 100000),
  updated_at timestamptz not null default now()
);
create table if not exists public.solar_systems (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  panel_capacity_kwp numeric not null check (panel_capacity_kwp > 0 and panel_capacity_kwp <= 100),
  inverter_brand text,
  inverter_model text check (length(inverter_model) <= 100),
  inverter_capacity_kw numeric check (inverter_capacity_kw > 0 and inverter_capacity_kw <= 100),
  panel_count integer check (panel_count between 1 and 200),
  updated_at timestamptz not null default now()
);
create table if not exists public.technician_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  service_district text not null,
  specialization text not null check (specialization in ('solar_installation','inverter_repair','electrical_maintenance','general_solar')),
  experience_years integer check (experience_years between 0 and 80),
  qualification text check (length(qualification) <= 200),
  updated_at timestamptz not null default now()
);

alter table public.household_details enable row level security;
alter table public.solar_systems enable row level security;
alter table public.technician_details enable row level security;
-- Direct writes are forbidden: the RPC validates the current role and values.
revoke all on public.household_details, public.solar_systems, public.technician_details from public, anon, authenticated;
grant select on public.household_details, public.solar_systems, public.technician_details to authenticated;

drop policy if exists member_details_read on public.household_details;
create policy member_details_read on public.household_details for select to authenticated
using (user_id = auth.uid() or public.is_admin() or exists (
  select 1 from public.jobs j where j.household_user_id = user_id and j.technician_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'technician')
));
drop policy if exists member_system_read on public.solar_systems;
create policy member_system_read on public.solar_systems for select to authenticated
using (user_id = auth.uid() or public.is_admin() or exists (
  select 1 from public.jobs j where j.household_user_id = user_id and j.technician_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'technician')
));
drop policy if exists technician_details_read on public.technician_details;
create policy technician_details_read on public.technician_details for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Internal helper used by signup and the authenticated edit RPC. Never exposed
-- to callers: allowing a caller-supplied user id would bypass ownership checks.
create or replace function public.apply_registration_details(p_user uuid, p_details jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member_role text;
  district text := nullif(trim(p_details->>'district'), '');
  capacity numeric;
begin
  select role into strict member_role from public.profiles where id = p_user;
  if member_role not in ('owner','consumer','technician') then raise exception 'Unsupported registration role'; end if;
  if district is null or district <> all(array['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya']) then
    raise exception 'Choose a valid district';
  end if;
  if member_role = 'technician' then
    if nullif(p_details->>'specialization','') is null then raise exception 'Choose a specialization'; end if;
    if nullif(p_details->>'experienceYears','')::numeric <> trunc(nullif(p_details->>'experienceYears','')::numeric) then raise exception 'Experience must be a whole number'; end if;
    insert into public.technician_details(user_id,service_district,specialization,experience_years,qualification)
    values(p_user,district,p_details->>'specialization',nullif(p_details->>'experienceYears','')::integer,nullif(trim(p_details->>'qualification'),''))
    on conflict(user_id) do update set service_district=excluded.service_district,specialization=excluded.specialization,experience_years=excluded.experience_years,qualification=excluded.qualification,updated_at=now();
    delete from public.household_details where user_id=p_user;
    delete from public.solar_systems where user_id=p_user;
  else
    if nullif(trim(p_details->>'address'),'') is null or nullif(trim(p_details->>'city'),'') is null then raise exception 'Address and city are required'; end if;
    insert into public.household_details(user_id,address,district,city,monthly_consumption_kwh)
    values(p_user,trim(p_details->>'address'),district,trim(p_details->>'city'),case when member_role='consumer' then nullif(p_details->>'monthlyConsumption','')::numeric else null end)
    on conflict(user_id) do update set address=excluded.address,district=excluded.district,city=excluded.city,monthly_consumption_kwh=excluded.monthly_consumption_kwh,updated_at=now();
    delete from public.technician_details where user_id=p_user;
    if member_role='owner' then
      capacity := nullif(p_details->>'solarCapacity','')::numeric;
      if capacity is null then raise exception 'Panel capacity is required'; end if;
      if nullif(p_details->>'inverterBrand','') is not null and (p_details->>'inverterBrand') <> all(array['Huawei','Sungrow','Growatt','SMA','GoodWe','Solis','Deye','Fronius','Other','Unknown']) then raise exception 'Choose a valid inverter brand'; end if;
      if nullif(p_details->>'panelCount','')::numeric <> trunc(nullif(p_details->>'panelCount','')::numeric) then raise exception 'Panel count must be a whole number'; end if;
      insert into public.solar_systems(user_id,panel_capacity_kwp,inverter_brand,inverter_model,inverter_capacity_kw,panel_count)
      values(p_user,capacity,nullif(p_details->>'inverterBrand',''),nullif(trim(p_details->>'inverterModel'),''),nullif(p_details->>'inverterCapacity','')::numeric,nullif(p_details->>'panelCount','')::integer)
      on conflict(user_id) do update set panel_capacity_kwp=excluded.panel_capacity_kwp,inverter_brand=excluded.inverter_brand,inverter_model=excluded.inverter_model,inverter_capacity_kw=excluded.inverter_capacity_kw,panel_count=excluded.panel_count,updated_at=now();
      update public.profiles set solar_capacity_kw=capacity where id=p_user;
    else
      delete from public.solar_systems where user_id=p_user;
    end if;
  end if;
end $$;
revoke all on function public.apply_registration_details(uuid,jsonb) from public, anon, authenticated;

create or replace function public.save_my_registration_details(p_details jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to update your details'; end if;
  perform public.apply_registration_details(auth.uid(),p_details);
end $$;
revoke all on function public.save_my_registration_details(jsonb) from public, anon;
grant execute on function public.save_my_registration_details(jsonb) to authenticated;

-- The existing auth.users INSERT trigger continues calling this function.
-- Role/status are chosen on the server, never trusted from client metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  member_role text := coalesce(new.raw_user_meta_data->>'role','consumer');
  capacity numeric;
begin
  if member_role not in ('owner','consumer','technician') then raise exception 'Invalid registration role'; end if;
  capacity := case when member_role='owner' then coalesce(nullif(new.raw_user_meta_data->'registration_details'->>'solarCapacity','')::numeric,nullif(new.raw_user_meta_data->>'solar_capacity_kw','')::numeric,0) else 0 end;
  insert into public.profiles(id,name,role,mobile_number,household_id,solar_capacity_kw,status)
  values(new.id,coalesce(new.raw_user_meta_data->>'name','New Co-op Member'),member_role,
    coalesce(new.raw_user_meta_data->>'mobile_number',new.raw_user_meta_data->>'mobileNumber'),
    'HH-' || substring(replace(new.id::text,'-','') from 1 for 12),capacity,
    case when member_role='owner' then 'pending_approval' else 'active' end);
  if new.raw_user_meta_data ? 'registration_details' then
    perform public.apply_registration_details(new.id,new.raw_user_meta_data->'registration_details');
    -- Private addresses/qualifications belong in protected tables, not JWTs.
    update auth.users set raw_user_meta_data=raw_user_meta_data-'registration_details' where id=new.id;
  elsif new.raw_user_meta_data->>'registration_version'='2' then
    raise exception 'Registration details are required';
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Jobs expose only the general service area. Full addresses stay protected
-- because the existing jobs SELECT policy allows all technicians to read jobs.
create or replace function public.set_job_service_area()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.site_area is null then
    select concat_ws(', ',h.city,h.district) into new.site_area
    from public.household_details h where h.user_id=new.household_user_id;
  end if;
  return new;
end $$;
revoke all on function public.set_job_service_area() from public, anon, authenticated;
drop trigger if exists job_service_area on public.jobs;
create trigger job_service_area before insert on public.jobs for each row execute function public.set_job_service_area();

notify pgrst, 'reload schema';
commit;
