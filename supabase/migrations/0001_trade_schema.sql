-- SolarCoop — Trade & Energy backend schema (SOL-149, SOL-150, and later
-- SOL-106..109, SOL-136/137). Apply via the Supabase SQL Editor.
--
-- NOTE (2026-08-24): `energy_records` and `energy_requests` already existed
-- in the live database before this migration was first run — built
-- independently (energy_records for the dashboard/chart backend work,
-- energy_requests likely from an earlier attempt at this same story). Their
-- real column names differ from what this file originally assumed:
--
--   energy_records:  id (bigint), user_id (uuid), production_kwh (numeric),
--                     consumption_kwh (numeric), surplus_kwh (numeric,
--                     nullable — already stored, read it directly rather
--                     than recomputing), recorded_at (timestamptz — NOT a
--                     plain date, so "today's" record means the most
--                     recent row per user, not an exact date match)
--   energy_requests:  id (bigint), requester_id (uuid), provider_id (uuid),
--                     amount_requested_kwh (numeric), status (text,
--                     default 'PENDING'), created_at (timestamptz).
--                     No `message` or `updated_at` column exists.
--
-- Both already have RLS enabled with policies covering select/insert (and,
-- for energy_requests, provider update) — do not re-create policies here,
-- Postgres will error on the duplicate. Only run the two blocks below:
-- they add what was genuinely still missing.

-- ── profiles: three new display-only columns (existing table) ──────────────
-- Not real pricing/IoT/geolocation — simple stored, seeded values so the
-- existing Sprint 1 UI (rate, battery SoC, distance) keeps rendering.
alter table public.profiles
  add column if not exists rate_per_kwh numeric(4,2) default 0.22,
  add column if not exists battery_soc smallint default 80,
  add column if not exists distance_label text default '120 m';

-- ── transactions ─────────────────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  request_id bigint references public.energy_requests(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  energy_amount numeric not null check (energy_amount > 0),
  status text not null default 'COMPLETED' check (status in ('COMPLETED', 'REVERSED')),
  reference_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "sender or receiver can read a transaction"
  on public.transactions for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "the sender can create a transaction for their own approval"
  on public.transactions for insert
  with check (auth.uid() = sender_id);
