-- SolarCoop — Technician job tickets (SOL-191 / SOL-194)
-- Migration: 0006_technician_jobs.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0005_alert_scan_support.sql.
-- Run it BEFORE using the Technician Portal: the portal reads public.jobs.
--
-- Adds:
--   1. public.is_technician() — same SECURITY DEFINER pattern as is_admin().
--   2. public.jobs — one row per fault a technician has to attend. It is the
--      single record behind BOTH alert views (SOL-201): the technician reads
--      the raw error code / checklist, the household reads consumer_message
--      and technician_name. Client and site details are snapshotted onto the
--      job at creation so a technician never needs read access to profiles.
--   3. Automatic dispatch: a complaint filed with type 'System Fault' raises
--      a pending job for that household (trigger below). This is the live
--      "fault reported" signal we have today; telemetry-driven dispatch
--      (inverter error codes pushed from the device) is a Sprint 4 follow-up
--      and will insert into this same table with source = 'telemetry'.
--
-- Safe to re-run: create-if-not-exists / create-or-replace throughout, and
-- policies and triggers are dropped before being recreated.

-- ── 1. is_technician() ───────────────────────────────────────────────────────
create or replace function public.is_technician()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'technician'
  );
$$;

-- ── 2. jobs ──────────────────────────────────────────────────────────────────
create sequence if not exists public.jobs_ticket_seq start 1001;

create table if not exists public.jobs (
  id                   uuid        primary key default gen_random_uuid(),
  ticket_code          text        not null unique
                                   default ('JOB-' || nextval('public.jobs_ticket_seq')::text),

  -- Who is affected (snapshotted from profiles when the job is raised)
  household_user_id    uuid        references public.profiles(id) on delete cascade,
  client_name          text,
  client_phone         text,
  site_address         text,
  site_area            text,
  distance_km          numeric(5,1),

  -- What is wrong — technician-facing, raw
  title                text        not null,
  device               text,
  error_code           text,
  error_message        text,
  fault_location       text,
  urgency              text        not null default 'medium'
                                   check (urgency in ('urgent', 'medium', 'low')),
  diagnostic_checklist jsonb       not null default
    '[{"label":"Test DC voltage","done":false},{"label":"Inspect MC4 joints","done":false},{"label":"Check isolator switch","done":false}]'::jsonb,

  -- What the household is told — plain language, no error codes
  consumer_message     text,

  -- Workflow
  status               text        not null default 'pending'
                                   check (status in ('pending', 'active', 'completed')),
  technician_id        uuid        references public.profiles(id) on delete set null,
  technician_name      text,
  resolution_notes     text,

  -- Origin
  source               text        not null default 'manual'
                                   check (source in ('complaint', 'telemetry', 'manual')),
  complaint_id         uuid        references public.complaints(id) on delete set null,

  created_at           timestamptz not null default now(),
  accepted_at          timestamptz,
  completed_at         timestamptz,
  updated_at           timestamptz not null default now()
);

create index if not exists jobs_status_idx    on public.jobs (status, created_at desc);
create index if not exists jobs_household_idx on public.jobs (household_user_id, created_at desc);

comment on table  public.jobs is 'Technician job tickets. One row per fault; read by both the technician and the affected household.';
comment on column public.jobs.consumer_message is 'Calm, plain-language message shown to the household. Never contains error codes.';
comment on column public.jobs.technician_name  is 'Snapshotted on accept so the household can see who is coming without reading profiles.';

-- Keep updated_at honest.
create or replace function public.touch_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_jobs_touch on public.jobs;
create trigger trg_jobs_touch
  before update on public.jobs
  for each row execute function public.touch_jobs_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.jobs enable row level security;

drop policy if exists "admin_all_jobs"          on public.jobs;
drop policy if exists "technician_read_jobs"    on public.jobs;
drop policy if exists "technician_update_jobs"  on public.jobs;
drop policy if exists "technician_insert_jobs"  on public.jobs;
drop policy if exists "household_read_own_jobs" on public.jobs;

create policy "admin_all_jobs"
  on public.jobs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Any technician can see the whole board: the open queue plus their own work.
create policy "technician_read_jobs"
  on public.jobs for select
  using (public.is_technician());

-- A technician may pick up an unassigned job, or work on one they own.
-- `with check` stops them handing a job to someone else.
create policy "technician_update_jobs"
  on public.jobs for update
  using (public.is_technician() and (technician_id is null or technician_id = auth.uid()))
  with check (public.is_technician() and technician_id = auth.uid());

-- Technicians can log a job they found on site (source = 'manual').
create policy "technician_insert_jobs"
  on public.jobs for insert
  with check (public.is_technician());

-- The household only ever reads its own jobs; the app shows them the
-- consumer_message / technician_name columns, never the raw fault fields.
create policy "household_read_own_jobs"
  on public.jobs for select
  using (household_user_id = auth.uid());

-- ── 3. Automatic dispatch from a 'System Fault' complaint ───────────────────
create or replace function public.raise_job_from_complaint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_name  text;
  member_phone text;
begin
  select name, mobile_number into member_name, member_phone
  from public.profiles where id = new.user_id;

  insert into public.jobs (
    household_user_id, client_name, client_phone,
    title, error_message, urgency, consumer_message,
    source, complaint_id
  ) values (
    new.user_id,
    member_name,
    member_phone,
    'Reported System Fault',
    left(coalesce(new.description, ''), 240),
    'medium',
    'We received your report and a technician will check your system shortly. There is nothing you need to do.',
    'complaint',
    new.id
  );

  return new;
exception
  when others then
    -- Never block the complaint itself because dispatch failed.
    raise warning 'raise_job_from_complaint failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_complaint_job on public.complaints;

create trigger trg_complaint_job
  after insert on public.complaints
  for each row
  when (new.type = 'System Fault')
  execute function public.raise_job_from_complaint();
