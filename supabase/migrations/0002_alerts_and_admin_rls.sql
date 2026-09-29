-- SolarCoop — Alerts table + Admin RLS access (SOL-155)
-- Migration: 0002_alerts_and_admin_rls.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0001_trade_schema.sql
-- and 001_energy_tables.sql have already been applied.
--
-- Adds:
--   1. A reusable public.is_admin() helper. SECURITY DEFINER so it can read
--      profiles.role regardless of profiles' own RLS policies (avoids any
--      circular-dependency issue between an admin check and the table
--      being checked).
--   2. The `alerts` table (did not exist anywhere before this) + its RLS.
--   3. The two admin policies `transactions` was missing — right now only
--      the sender/receiver can read a transaction, and only the sender can
--      insert one. Nothing lets an admin see or update ANY transaction,
--      which blocks the whole Transaction Monitoring screen from working
--      for an admin account.
--
-- Nothing here touches existing tables' data or existing policies on
-- transactions/energy_records/energy_requests/profiles — this only adds
-- what was genuinely missing. Safe to run once; do not re-run after it
-- succeeds (re-running `create policy` on a name that already exists will
-- error — see the notes in 0001_trade_schema.sql for the same reasoning).

-- ── 1. is_admin() helper ─────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 2. alerts ──────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id         uuid        primary key default gen_random_uuid(),
  alert_type text        not null,
  user_id    uuid        references public.profiles(id) on delete cascade,
  message    text        not null,
  severity   text        not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status     text        not null default 'active'  check (status   in ('active', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

comment on column public.alerts.user_id is 'Null = community-wide alert, not tied to one member.';

alter table public.alerts enable row level security;

-- Admin gets full CRUD in one policy (Alert Management is the one domain
-- in this sprint where create/read/update/delete are all real use cases).
create policy "admin_write_alerts"
  on public.alerts for all
  using (public.is_admin())
  with check (public.is_admin());

-- A member sees their own alerts, plus community-wide ones (user_id null).
-- No insert/update/delete for members — alerts are admin-issued.
create policy "member_read_own_alerts"
  on public.alerts for select
  using (user_id = auth.uid() or user_id is null);

-- ── 3. transactions — the two missing admin policies ────────────────────────
-- Table + sender/receiver policies already exist from 0001_trade_schema.sql.
-- Deliberately no admin insert/delete policy: transactions originate from
-- the trade acceptance flow (Epic 3), never from an admin action.

create policy "admin_read_all_transactions"
  on public.transactions for select
  using (public.is_admin());

create policy "admin_update_transaction_status"
  on public.transactions for update
  using (public.is_admin())
  with check (public.is_admin());
