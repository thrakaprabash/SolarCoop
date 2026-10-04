-- Run this WHOLE file once in the Supabase SQL Editor, using the postgres role.
-- This is a verification script, not a migration. It uses existing test accounts.
-- All fixture requests and transactions are rolled back. Explicit negative IDs
-- avoid advancing the request sequence (sequences do not roll back).
-- If an assertion fails, run ROLLBACK; and share the error before retrying.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create temporary table phase6_context on commit drop as
select t.sender_id as provider_id, t.receiver_id as requester_id,
  '14c3d153-7e44-4140-8a5c-9e6466485d2e'::uuid as third_id,
  least(coalesce((select min(id) from public.energy_requests), 0), 0) - 10 as base_id
from public.transactions t
where t.id = 'e3bed65b-5b06-41ce-870e-330558931bec';
create temporary table phase6_results (
  check_name text primary key, result text not null
) on commit drop;
grant select on phase6_context to authenticated;
grant select, insert on phase6_results to authenticated;

-- SET ROLE is essential: changing JWT claims alone still bypasses RLS as postgres.
set local role authenticated;
do $$
declare
  c record;
  before_kwh numeric;
  amount_kwh numeric := 0.001;
  txn_id uuid;
  changed integer;
  blocked boolean;
begin
  select * into c from pg_temp.phase6_context;
  if not found then raise exception 'The saved Phase 3 test transaction was not found.'; end if;
  if not exists (select 1 from public.profiles where id = c.third_id)
    or c.third_id in (c.provider_id, c.requester_id) then
    raise exception 'The unrelated test member is unavailable.';
  end if;
  if current_user <> 'authenticated' then raise exception 'Incorrect effective role.'; end if;
  if has_function_privilege('anon', 'public.trade_approve_request(bigint)', 'EXECUTE')
    or has_function_privilege('anon', 'public.trade_reject_request(bigint)', 'EXECUTE')
    or has_function_privilege('anon', 'public.trade_available_providers()', 'EXECUTE') then
    raise exception 'Anonymous RPC execution is unexpectedly permitted.';
  end if;
  insert into pg_temp.phase6_results values ('rpc_grants', 'PASS');

  perform set_config('request.jwt.claims', json_build_object('sub', c.provider_id, 'role', 'authenticated')::text, true);
  if auth.uid() <> c.provider_id or public.is_admin() then raise exception 'Incorrect provider identity.'; end if;
  before_kwh := trade_private.available_kwh(c.provider_id);
  if before_kwh is null or before_kwh < amount_kwh then raise exception 'Provider needs at least 0.001 kWh for the rollback test.'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', c.requester_id, 'role', 'authenticated')::text, true);
  if auth.uid() <> c.requester_id or public.is_admin() then raise exception 'Incorrect requester identity.'; end if;
  insert into public.energy_requests (id, requester_id, provider_id, amount_requested_kwh, status)
  values (c.base_id, c.requester_id, c.provider_id, amount_kwh, 'PENDING'),
    (c.base_id - 1, c.requester_id, c.provider_id, before_kwh + 1, 'PENDING'),
    (c.base_id - 2, c.requester_id, c.provider_id, amount_kwh, 'PENDING');
  if (select count(*) from public.energy_requests where id between c.base_id - 2 and c.base_id) <> 3 then
    raise exception 'Requester could not read their three temporary requests.';
  end if;
  blocked := false;
  begin
    insert into public.energy_requests (id, requester_id, provider_id, amount_requested_kwh, status)
    values (c.base_id - 3, c.requester_id, c.provider_id, amount_kwh, 'COMPLETED');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'A requester could forge a completed request.'; end if;
  insert into pg_temp.phase6_results values ('pending_submission_and_insert_guard', 'PASS');

  perform set_config('request.jwt.claims', json_build_object('sub', c.third_id, 'role', 'authenticated')::text, true);
  if auth.uid() <> c.third_id or public.is_admin() then raise exception 'Incorrect third-member identity.'; end if;
  if exists (select 1 from public.energy_requests where id between c.base_id - 2 and c.base_id) then
    raise exception 'An unrelated member can read the temporary requests.';
  end if;
  blocked := false;
  begin perform public.trade_approve_request(c.base_id);
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'An unrelated member can approve.'; end if;
  blocked := false;
  begin perform public.trade_reject_request(c.base_id);
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'An unrelated member can reject.'; end if;
  insert into pg_temp.phase6_results values ('unrelated_request_read_and_actions', 'PASS');

  perform set_config('request.jwt.claims', json_build_object('sub', c.provider_id, 'role', 'authenticated')::text, true);
  if (select count(*) from public.energy_requests where id between c.base_id - 2 and c.base_id) <> 3 then
    raise exception 'Provider could not read the temporary requests.';
  end if;
  txn_id := public.trade_approve_request(c.base_id);
  if (select status from public.energy_requests where id = c.base_id) <> 'COMPLETED'
    or (select count(*) from public.transactions where request_id = c.base_id) <> 1
    or not exists (select 1 from public.transactions where id = txn_id and sender_id = c.provider_id
      and receiver_id = c.requester_id and energy_amount = amount_kwh and status = 'COMPLETED')
    or trade_private.available_kwh(c.provider_id) <> before_kwh - amount_kwh then
    raise exception 'Approval did not complete exactly one matching transfer.';
  end if;
  insert into pg_temp.phase6_results values ('approval_atomic_result', 'PASS');

  blocked := false;
  begin perform public.trade_approve_request(c.base_id);
  exception when raise_exception then
    if sqlerrm <> 'This request has already been processed.' then raise; end if;
    blocked := true;
  end;
  if not blocked or (select count(*) from public.transactions where request_id = c.base_id) <> 1
    or trade_private.available_kwh(c.provider_id) <> before_kwh - amount_kwh then
    raise exception 'Repeated approval changed the ledger or surplus.';
  end if;
  insert into pg_temp.phase6_results values ('repeat_approval_no_duplicate', 'PASS');

  blocked := false;
  begin perform public.trade_approve_request(c.base_id - 1);
  exception when raise_exception then
    if sqlerrm <> 'Insufficient available surplus.' then raise; end if;
    blocked := true;
  end;
  if not blocked or (select status from public.energy_requests where id = c.base_id - 1) <> 'PENDING'
    or exists (select 1 from public.transactions where request_id = c.base_id - 1)
    or trade_private.available_kwh(c.provider_id) <> before_kwh - amount_kwh then
    raise exception 'Insufficient-surplus approval changed persisted state.';
  end if;
  insert into pg_temp.phase6_results values ('insufficient_surplus_no_changes', 'PASS');

  perform public.trade_reject_request(c.base_id - 2);
  if (select status from public.energy_requests where id = c.base_id - 2) <> 'REJECTED'
    or exists (select 1 from public.transactions where request_id = c.base_id - 2)
    or trade_private.available_kwh(c.provider_id) <> before_kwh - amount_kwh then
    raise exception 'Rejection changed the ledger or surplus.';
  end if;
  insert into pg_temp.phase6_results values ('rejection_no_transfer', 'PASS');

  update public.energy_requests set status = 'REJECTED' where id = c.base_id - 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Provider can bypass RPC through direct update.'; end if;
  blocked := false;
  begin
    insert into public.transactions (request_id, sender_id, receiver_id, energy_amount, reference_code)
    values (c.base_id - 1, c.provider_id, c.requester_id, amount_kwh, 'PHASE6-ROLLBACK-ONLY');
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'Provider can insert a ledger row directly.'; end if;
  insert into pg_temp.phase6_results values ('direct_write_guards', 'PASS');

  perform set_config('request.jwt.claims', json_build_object('sub', c.requester_id, 'role', 'authenticated')::text, true);
  if not exists (select 1 from public.transactions where id = txn_id)
    or (select status from public.energy_requests where id = c.base_id) <> 'COMPLETED'
    or (select status from public.energy_requests where id = c.base_id - 2) <> 'REJECTED' then
    raise exception 'Requester cannot see the saved outcomes.';
  end if;
  insert into pg_temp.phase6_results values ('requester_sees_outcomes', 'PASS');

  perform set_config('request.jwt.claims', json_build_object('sub', c.third_id, 'role', 'authenticated')::text, true);
  if exists (select 1 from public.transactions where id = txn_id)
    or exists (select 1 from public.transactions where id = 'e3bed65b-5b06-41ce-870e-330558931bec') then
    raise exception 'Unrelated member can read a participant transaction.';
  end if;
  insert into pg_temp.phase6_results values ('unrelated_transaction_access', 'PASS');
end;
$$;

select check_name, result from pg_temp.phase6_results order by check_name;
rollback;
