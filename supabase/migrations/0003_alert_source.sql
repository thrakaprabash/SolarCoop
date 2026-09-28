-- SolarCoop — Alert origin marker (SOL-157)
-- Migration: 0003_alert_source.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0002_alerts_and_admin_rls.sql.
-- Run it BEFORE using the updated app: the admin Alerts screen now selects this column.
--
-- Records who raised each alert, so the app can enforce one rule: only alerts an
-- admin created themselves can have their message/severity edited. Alerts the
-- system raises automatically (transaction reversed, low production, etc.) are
-- a record of what the detector saw and stay read-only apart from status
-- (resolve / reopen) and delete.
--
-- Every alert that exists today was created by an admin through the app, so the
-- default of 'admin' is correct for existing rows. Automatic alerts will set
-- source = 'system' explicitly when they insert.
--
-- No RLS change needed: `admin_write_alerts` and `member_read_own_alerts` are
-- row-level and already cover the new column.

alter table public.alerts
  add column if not exists source text not null default 'admin'
    check (source in ('admin', 'system'));

comment on column public.alerts.source is
  'Who raised this alert: an admin via the app, or the system (automatic detection).';
