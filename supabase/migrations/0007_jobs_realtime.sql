-- SolarCoop — Live sync for technician jobs (SOL-201)
-- Migration: 0007_jobs_realtime.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0006_technician_jobs.sql.
--
-- Adds public.jobs to the `supabase_realtime` publication so both sides of a
-- fault update live from the same row:
--   • the Technician Portal refreshes when a job is raised, accepted by
--     someone else, or changes status;
--   • the household's "maintenance scheduled" card picks up the assigned
--     technician's name on accept, and flips to "complete" on close.
--
-- Realtime applies the table's RLS, so a household only receives events for
-- its own jobs and technicians receive what `technician_read_jobs` allows.
-- Without this migration the app still works — it just updates on
-- pull-to-refresh instead of live.
--
-- Safe to re-run: the table is only added if it isn't in the publication yet.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jobs'
  ) then
    alter publication supabase_realtime add table public.jobs;
  end if;
end;
$$;
