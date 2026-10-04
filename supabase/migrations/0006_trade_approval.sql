-- Sprint 3 energy-sharing workflow (SOL-175, SOL-176, SOL-177, SOL-178).
-- Apply after 0005_alert_scan_support.sql. This migration does not alter
-- energy_records or dashboard metrics.
--
-- Tradeable kWh = latest measured surplus - completed sent transactions
-- created after that measurement. A new reading becomes the new baseline.

-- A completed exchange has both a COMPLETED request and a COMPLETED ledger row.
update public.energy_requests
set status = 'PENDING'
where status is null;

alter table public.energy_requests
  drop constraint energy_requests_status_check;

alter table public.energy_requests
  add constraint energy_requests_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'));

alter table public.energy_requests
  alter column status set not null;

-- Preserve any older approved requests that already have a completed ledger row.
update public.energy_requests as request
set status = 'COMPLETED'
where request.status = 'APPROVED'
  and exists (
    select 1 from public.transactions as transaction
    where transaction.request_id = request.id
      and transaction.status = 'COMPLETED'
  );

-- Existing linked transactions were checked for duplicates before this change.
create unique index if not exists transactions_one_per_request_idx
  on public.transactions (request_id)
  where request_id is not null;

create index if not exists energy_records_provider_latest_idx
  on public.energy_records (user_id, recorded_at desc, id desc);

create index if not exists transactions_sender_time_idx
  on public.transactions (sender_id, created_at desc)
  where status = 'COMPLETED';

-- Supabase's exposed public schema only contains SECURITY INVOKER wrappers.
-- The privileged work stays in a non-exposed schema with explicit grants.
create schema if not exists trade_private;

-- VOLATILE gives the approval operation a fresh view after it waits for
-- another approval's provider-row lock and committed transaction.
create function trade_private.available_kwh(p_provider_id uuid)
returns numeric
language sql volatile security definer set search_path = ''
as $$
  with latest as (
    select
      greatest(
        0::numeric,
        coalesce(
          reading.surplus_kwh,
          reading.production_kwh - reading.consumption_kwh
        )
      ) as measured_kwh,
      reading.recorded_at
    from public.energy_records as reading
    where reading.user_id = p_provider_id
    order by reading.recorded_at desc, reading.id desc
    limit 1
  )
  select greatest(
    0::numeric,
    latest.measured_kwh - coalesce((
      select sum(transaction.energy_amount)
      from public.transactions as transaction
      where transaction.sender_id = p_provider_id
        and transaction.status = 'COMPLETED'
        and transaction.created_at > latest.recorded_at
    ), 0::numeric)
  )
  from latest;
$$;

create function trade_private.available_providers()
returns table (
  id uuid,
  name text,
  household_id text,
  rate_per_kwh numeric,
  battery_soc smallint,
  distance_label text,
  available_kwh numeric
)
language sql volatile security definer set search_path = ''
as $$
  select
    provider.id,
    provider.name,
    provider.household_id,
    provider.rate_per_kwh,
    provider.battery_soc,
    provider.distance_label,
    coalesce(trade_private.available_kwh(provider.id), 0::numeric)
  from public.profiles as provider
  where auth.uid() is not null
    and provider.role = 'owner'
    and provider.status = 'active';
$$;

create function trade_private.approve_request(p_request_id bigint)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  request public.energy_requests%rowtype;
  provider public.profiles%rowtype;
  remaining_kwh numeric;
  transaction_id uuid := pg_catalog.gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Sign in to approve a request.' using errcode = '42501';
  end if;

  select * into request
  from public.energy_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;
  if request.provider_id <> auth.uid() then
    raise exception 'Only the provider can approve this request.' using errcode = '42501';
  end if;
  if request.status is distinct from 'PENDING' then
    raise exception 'This request has already been processed.';
  end if;
  if request.requester_id = request.provider_id then
    raise exception 'A provider cannot approve their own request.';
  end if;

  -- All approvals for this provider serialize on the same profile row.
  select * into provider
  from public.profiles
  where id = request.provider_id
  for update;

  if provider.role is distinct from 'owner' or provider.status is distinct from 'active' then
    raise exception 'This provider is not active.' using errcode = '42501';
  end if;

  remaining_kwh := trade_private.available_kwh(request.provider_id);
  if remaining_kwh is null then
    raise exception 'No current energy reading is available.';
  end if;
  if request.amount_requested_kwh > remaining_kwh then
    raise exception 'Insufficient available surplus.';
  end if;

  insert into public.transactions (
    id, request_id, sender_id, receiver_id, energy_amount,
    status, reference_code
  ) values (
    transaction_id,
    request.id,
    request.provider_id,
    request.requester_id,
    request.amount_requested_kwh,
    'COMPLETED',
    'TXN-' || upper(replace(transaction_id::text, '-', ''))
  );

  update public.energy_requests
  set status = 'COMPLETED'
  where id = request.id;

  return transaction_id;
end;
$$;

create function trade_private.reject_request(p_request_id bigint)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  request public.energy_requests%rowtype;
  provider public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to reject a request.' using errcode = '42501';
  end if;

  select * into request
  from public.energy_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;
  if request.provider_id <> auth.uid() then
    raise exception 'Only the provider can reject this request.' using errcode = '42501';
  end if;
  if request.status is distinct from 'PENDING' then
    raise exception 'This request has already been processed.';
  end if;

  select * into provider
  from public.profiles
  where id = request.provider_id
  for update;

  if provider.role is distinct from 'owner' or provider.status is distinct from 'active' then
    raise exception 'This provider is not active.' using errcode = '42501';
  end if;

  update public.energy_requests
  set status = 'REJECTED'
  where id = request.id;

  return true;
end;
$$;

-- Public RPC entry points run with the caller's privileges. Their only
-- privileged operation is the explicitly granted call into trade_private.
create function public.trade_available_providers()
returns table (
  id uuid,
  name text,
  household_id text,
  rate_per_kwh numeric,
  battery_soc smallint,
  distance_label text,
  available_kwh numeric
)
language sql volatile security invoker set search_path = ''
as $$
  select * from trade_private.available_providers();
$$;

create function public.trade_approve_request(p_request_id bigint)
returns uuid
language sql volatile security invoker set search_path = ''
as $$
  select trade_private.approve_request(p_request_id);
$$;

create function public.trade_reject_request(p_request_id bigint)
returns boolean
language sql volatile security invoker set search_path = ''
as $$
  select trade_private.reject_request(p_request_id);
$$;

revoke all on schema trade_private from public, anon;
grant usage on schema trade_private to authenticated;

revoke all on function trade_private.available_kwh(uuid) from public, anon;
revoke all on function trade_private.available_providers() from public, anon;
revoke all on function trade_private.approve_request(bigint) from public, anon;
revoke all on function trade_private.reject_request(bigint) from public, anon;
grant execute on function trade_private.available_kwh(uuid) to authenticated;
grant execute on function trade_private.available_providers() to authenticated;
grant execute on function trade_private.approve_request(bigint) to authenticated;
grant execute on function trade_private.reject_request(bigint) to authenticated;

revoke all on function public.trade_available_providers() from public, anon;
revoke all on function public.trade_approve_request(bigint) from public, anon;
revoke all on function public.trade_reject_request(bigint) from public, anon;
grant execute on function public.trade_available_providers() to authenticated;
grant execute on function public.trade_approve_request(bigint) to authenticated;
grant execute on function public.trade_reject_request(bigint) to authenticated;

-- Direct writes cannot enforce the multi-table approval/rejection checks.
-- The guarded functions above replace these two broad policies.
drop policy "Allow providers to update request status" on public.energy_requests;
drop policy "the sender can create a transaction for their own approval" on public.transactions;

-- A requester may create a pending request only. In particular, a client
-- cannot forge a COMPLETED request through the insert policy.
drop policy "Allow users to insert requests" on public.energy_requests;
create policy "Allow users to insert pending requests"
  on public.energy_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and requester_id <> provider_id
    and status = 'PENDING'
  );
