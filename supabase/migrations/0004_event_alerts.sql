-- SolarCoop — Event-driven system alerts (SOL-157, item 3b)
-- Migration: 0004_event_alerts.sql
--
-- Run this in the Supabase dashboard -> SQL Editor, after 0003_alert_source.sql.
--
-- Raises an alert automatically when something happens, via database triggers:
--
--   #7  transaction_reversed — when a transaction's status becomes REVERSED.
--       Two alerts, one per party (sender + receiver), so each member has a
--       record of it and the admin has an audit trail.
--   #12 complaint_new — when a complaint is inserted. One alert, targeted at
--       the complainant so the admin can drill down to that member.
--
-- Why triggers rather than app code: a complaint is filed from a MEMBER's
-- session, and members (rightly) cannot write to `alerts`. A trigger fires
-- whoever causes the event, runs in the same transaction as it, and needs no
-- extra permissions. The functions are SECURITY DEFINER for the same reason.
--
-- Each function swallows its own errors (logging a warning) so a problem
-- raising an alert can never block the reversal or the complaint itself.
-- If an alert you expect doesn't appear, check Logs -> Postgres for
-- "raise_..._alert failed".
--
-- Alerts raised here carry source = 'system', so the admin app treats them
-- as read-only apart from resolve / reopen / delete (see 0003).
--
-- Safe to re-run: functions use CREATE OR REPLACE, triggers and the policy
-- are dropped before being recreated.

-- ── #7 Transaction reversed ─────────────────────────────────────────────────
create or replace function public.raise_transaction_reversed_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name   text;
  receiver_name text;
  msg           text;
begin
  select name into sender_name   from public.profiles where id = new.sender_id;
  select name into receiver_name from public.profiles where id = new.receiver_id;

  msg := format(
    '%s kWh transfer from %s to %s (ref %s) was reversed by an admin.',
    round(new.energy_amount, 2),
    coalesce(sender_name, 'a member'),
    coalesce(receiver_name, 'a member'),
    new.reference_code
  );

  insert into public.alerts (alert_type, user_id, message, severity, source)
  values
    ('transaction_reversed', new.sender_id,   msg, 'medium', 'system'),
    ('transaction_reversed', new.receiver_id, msg, 'medium', 'system');

  return new;
exception
  when others then
    raise warning 'raise_transaction_reversed_alert failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_transaction_reversed_alert on public.transactions;

create trigger trg_transaction_reversed_alert
  after update of status on public.transactions
  for each row
  when (old.status is distinct from new.status and new.status = 'REVERSED')
  execute function public.raise_transaction_reversed_alert();

-- ── #12 New complaint filed ─────────────────────────────────────────────────
create or replace function public.raise_complaint_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_name      text;
  member_household text;
  who              text;
  sev              text;
begin
  select name, household_id into member_name, member_household
  from public.profiles where id = new.user_id;

  who := coalesce(member_name, 'A member')
         || case when member_household is not null
                 then ' (' || member_household || ')'
                 else '' end;

  -- Problems with the system or a trade are more pressing than the rest.
  sev := case new.type
    when 'Transaction Error' then 'medium'
    when 'System Fault'      then 'medium'
    else 'low'
  end;

  insert into public.alerts (alert_type, user_id, message, severity, source)
  values (
    'complaint_new',
    new.user_id,
    who || ' filed a ' || coalesce(new.type, 'new') || ' complaint.',
    sev,
    'system'
  );

  return new;
exception
  when others then
    raise warning 'raise_complaint_alert failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_complaint_alert on public.complaints;

create trigger trg_complaint_alert
  after insert on public.complaints
  for each row
  execute function public.raise_complaint_alert();

-- ── Audience: keep admin-only alert types out of members' reach ─────────────
-- The complaint alert is targeted at the complainant (so the admin can
-- drill down to them), which would otherwise make it readable by that member
-- under "member reads own alerts". These types are internal to the admin, so
-- members are never shown them. The list mirrors the "Admin only" rows of
-- alert_system_plan.md §2 — add new admin-only types here when they're added.
drop policy if exists "member_read_own_alerts" on public.alerts;

create policy "member_read_own_alerts"
  on public.alerts for select
  using (
    (user_id = auth.uid() or user_id is null)
    and alert_type not in (
      'large_transaction',
      'signup_pending',
      'member_silent',
      'complaint_new',
      'complaint_aging',
      'system_error'
    )
  );
