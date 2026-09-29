-- SolarCoop — Support for automatic (scan-raised) alerts (SOL-157, item 3c)
-- Migration: 0005_alert_scan_support.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0004_event_alerts.sql.
-- Run it BEFORE using the updated app: the alert scan refuses to run without it.
--
-- 1. alerts.dedupe_key — identifies "the same alert" across scans, e.g.
--    'zero_production:<member id>' or 'large_transaction:<transaction id>'.
--    The partial unique index means two scans running at once (say a launch
--    scan and a pull-to-refresh) can never leave two OPEN copies of one
--    alert: the second insert is rejected and the app treats that as "already
--    there". Once an alert is resolved or dismissed its key is free again, so
--    the same condition can be raised afresh later (the app also applies a
--    cooldown, so resolving something doesn't just get it re-raised by the
--    next scan). Alerts raised by the triggers in 0004 have no key and are
--    unaffected.
--
-- 2. Admin read access to the two tables the scan reads that were built with
--    member-only policies: energy_records (readings) and energy_requests
--    (pending requests). Purely additive — policies are OR'd together, so if
--    an admin could already read these, nothing changes; if not, this is what
--    lets the scan (and the Member Monitoring energy figures) see them.
--
-- Safe to re-run.

-- ── 1. De-duplication key ───────────────────────────────────────────────────
alter table public.alerts
  add column if not exists dedupe_key text;

create unique index if not exists alerts_active_dedupe_key_idx
  on public.alerts (dedupe_key)
  where status = 'active' and dedupe_key is not null;

-- ── 2. Admin read access for the scan's inputs ──────────────────────────────
drop policy if exists "admin_read_all_energy_records" on public.energy_records;

create policy "admin_read_all_energy_records"
  on public.energy_records for select
  using (public.is_admin());

drop policy if exists "admin_read_all_energy_requests" on public.energy_requests;

create policy "admin_read_all_energy_requests"
  on public.energy_requests for select
  using (public.is_admin());
