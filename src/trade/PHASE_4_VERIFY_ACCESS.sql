-- Read-only check of the saved test trade under a third member's identity.
-- Run the whole script in Supabase SQL Editor. Copy the phase4_access_check
-- result row. No accounts, policies, or transaction data are changed.
begin read only;

select set_config('trade.verify_third_id', coalesce((
  select profile.id::text
  from public.profiles as profile
  where profile.role in ('consumer', 'owner')
    and profile.id not in (
      select sender_id from public.transactions
      where id = 'e3bed65b-5b06-41ce-870e-330558931bec'
      union
      select receiver_id from public.transactions
      where id = 'e3bed65b-5b06-41ce-870e-330558931bec'
    )
  order by profile.id
  limit 1
), ''), true);

select
  set_config('request.jwt.claim.sub', current_setting('trade.verify_third_id'), true),
  set_config('request.jwt.claims', json_build_object(
    'sub', nullif(current_setting('trade.verify_third_id'), ''),
    'role', 'authenticated'
  )::text, true);

set local role authenticated;

select
  'phase4_access_check' as check_name,
  auth.uid() is not null as third_member_selected,
  public.is_admin() as admin_access,
  (select relrowsecurity from pg_class
    where oid = 'public.transactions'::regclass) as rls_enabled,
  count(*) as visible_transactions
from public.transactions
where id = 'e3bed65b-5b06-41ce-870e-330558931bec';

rollback;
