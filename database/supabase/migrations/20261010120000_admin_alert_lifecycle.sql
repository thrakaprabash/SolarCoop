-- Apply before deploying the matching admin app. No existing history is deleted.
begin;

alter table public.alerts add column resolved_at timestamptz;
alter table public.alerts add column auto_resolved boolean not null default false;
alter table public.alerts add column ref_type text;
alter table public.alerts add column ref_id text;
-- Historical resolution times are unknown; start their cooldown at migration.
update public.alerts set resolved_at = now() where status <> 'active';

create or replace function public.stamp_alert_resolution() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.source = 'system' and
      (to_jsonb(new) - array['status','resolved_at','auto_resolved']) is distinct from
      (to_jsonb(old) - array['status','resolved_at','auto_resolved']) then
      raise exception 'System alert contents cannot be changed.';
    end if;
  end if;
  if new.status = 'active' then
    new.resolved_at := null;
    new.auto_resolved := false;
  elsif tg_op = 'INSERT' then
    new.resolved_at := now();
  elsif old.status is distinct from new.status then
    new.resolved_at := now();
  else
    new.resolved_at := old.resolved_at;
    new.auto_resolved := old.auto_resolved;
  end if;
  return new;
end $$;
create trigger trg_alert_resolution before insert or update on public.alerts
for each row execute function public.stamp_alert_resolution();

drop policy if exists admin_write_alerts on public.alerts;
create policy admin_read_alerts on public.alerts for select using (public.is_admin());
create policy admin_insert_alerts on public.alerts for insert with check (public.is_admin());
create policy admin_update_alerts on public.alerts for update using (public.is_admin()) with check (public.is_admin());
create policy admin_delete_manual_alerts on public.alerts for delete using (public.is_admin() and source = 'admin');
drop policy if exists member_read_own_alerts on public.alerts;
create policy member_read_own_alerts on public.alerts for select using (
  (user_id = auth.uid() or user_id is null) and alert_type not in
  ('transaction_reversed','large_transaction','signup_pending','member_silent','complaint_new','complaint_aging','system_error')
);

alter table public.transactions add column reversed_at timestamptz;
alter table public.transactions add column reversed_by uuid references public.profiles(id);
alter table public.transactions add column reversal_reason text;

create or replace function public.guard_transaction_reversal() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new is not distinct from old then return old; end if;
  if not public.is_admin() or old.status <> 'COMPLETED' or new.status <> 'REVERSED' then
    raise exception 'Only an admin can reverse a completed transaction.';
  end if;
  if (to_jsonb(new) - array['status','reversal_reason']) is distinct from
     (to_jsonb(old) - array['status','reversal_reason']) then
    raise exception 'Transaction details and reversal audit are immutable.';
  end if;
  if length(btrim(coalesce(new.reversal_reason,''))) not between 10 and 500 then
    raise exception 'Enter a reversal reason of 10 to 500 characters.';
  end if;
  new.reversal_reason := btrim(new.reversal_reason);
  new.reversed_at := now();
  new.reversed_by := auth.uid();
  return new;
end $$;
create trigger trg_guard_transaction_reversal before update on public.transactions
for each row execute function public.guard_transaction_reversal();

drop policy if exists admin_update_transaction_status on public.transactions;
revoke update on public.transactions from authenticated;
create or replace function public.admin_reverse_transaction(p_transaction_id uuid, p_reason text)
returns public.transactions language plpgsql security definer set search_path = '' as $$
declare result public.transactions;
begin
  if not public.is_admin() then raise exception 'An admin account is required.' using errcode = '42501'; end if;
  select * into result from public.transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction not found.'; end if;
  if result.status = 'REVERSED' then return result; end if;
  update public.transactions set status = 'REVERSED', reversal_reason = p_reason
  where id = p_transaction_id returning * into result;
  return result;
end $$;
revoke all on function public.admin_reverse_transaction(uuid,text) from public, anon;
grant execute on function public.admin_reverse_transaction(uuid,text) to authenticated;

create or replace function public.raise_transaction_reversed_alert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sender_name text; receiver_name text; admin_name text;
begin
  select name into sender_name from public.profiles where id = new.sender_id;
  select name into receiver_name from public.profiles where id = new.receiver_id;
  select name into admin_name from public.profiles where id = new.reversed_by;
  insert into public.alerts(alert_type,user_id,message,severity,source,status,auto_resolved,ref_type,ref_id)
  values ('transaction_reversed',new.sender_id,
    format('%s kWh transfer from %s to %s (ref %s) was reversed by %s. Reason: %s',
      new.energy_amount,coalesce(sender_name,'a member'),coalesce(receiver_name,'a member'),
      new.reference_code,coalesce(admin_name,'an admin'),new.reversal_reason),
    'medium','system','resolved',true,'transaction',new.id::text);
  update public.alerts set status = 'resolved', auto_resolved = true
  where status = 'active' and source = 'system' and dedupe_key = 'large_transaction:' || new.id;
  return new;
end $$;
drop trigger if exists trg_transaction_reversed_alert on public.transactions;
create trigger trg_transaction_reversed_alert after update of status on public.transactions
for each row when (old.status is distinct from new.status and new.status = 'REVERSED')
execute function public.raise_transaction_reversed_alert();

create or replace function public.raise_complaint_alert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare member_name text;
begin
  select name into member_name from public.profiles where id = new.user_id;
  insert into public.alerts(alert_type,user_id,message,severity,source,dedupe_key,ref_type,ref_id)
  values ('complaint_new',new.user_id,coalesce(member_name,'A member') || ' filed a ' || new.type || ' complaint.',
    case when new.type in ('Transaction Error','System Fault') then 'medium' else 'low' end,
    'system','complaint_new:' || new.id,'complaint',new.id::text);
  return new;
exception when others then
  raise warning 'raise_complaint_alert failed: %', sqlerrm;
  return new;
end $$;

-- Event conditions close immediately, including when no admin has the app open.
create or replace function public.close_handled_event_alerts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare row_data jsonb; entity_id text; state text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity_id := row_data->>'id'; state := row_data->>'status';
  if tg_table_name = 'profiles' and (tg_op = 'DELETE' or state not in ('pending_approval','pending')) then
    update public.alerts set status='resolved',auto_resolved=true where source='system' and status='active'
      and dedupe_key='signup_pending:' || entity_id;
  elsif tg_table_name = 'energy_requests' and (tg_op = 'DELETE' or state <> 'PENDING') then
    update public.alerts set status='resolved',auto_resolved=true where source='system' and status='active'
      and dedupe_key='request_pending:' || entity_id;
  elsif tg_table_name = 'complaints' then
    if tg_op = 'DELETE' or state <> 'open' then
      update public.alerts set status='resolved',auto_resolved=true where source='system' and status='active'
        and dedupe_key='complaint_new:' || entity_id;
    end if;
    if tg_op = 'DELETE' or state not in ('open','under_review') then
      update public.alerts set status='resolved',auto_resolved=true where source='system' and status='active'
        and dedupe_key='complaint_aging:' || entity_id;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger trg_profiles_close_alerts after update of status or delete on public.profiles
for each row execute function public.close_handled_event_alerts();
create trigger trg_requests_close_alerts after update of status or delete on public.energy_requests
for each row execute function public.close_handled_event_alerts();
create trigger trg_complaints_close_alerts after update of status or delete on public.complaints
for each row execute function public.close_handled_event_alerts();

-- Publication changes are safe on a hosted Supabase project and optional locally.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='alerts') then
      alter publication supabase_realtime add table public.alerts;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='transactions') then
      alter publication supabase_realtime add table public.transactions;
    end if;
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
