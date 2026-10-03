-- SOL-202: Run after 0007. Evidence stays private; only the assigned technician
-- and admins can view it. Storage enforces JPG/PNG and the 10 MB limit too.
begin;

alter table public.jobs add column if not exists repair_photos jsonb not null default '[]'::jsonb
  check (jsonb_typeof(repair_photos) = 'array');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-evidence', 'repair-evidence', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists repair_evidence_read on storage.objects;
create policy repair_evidence_read on storage.objects for select to authenticated
using (bucket_id = 'repair-evidence' and exists (
  select 1 from public.jobs j where j.id::text = (storage.foldername(name))[1]
    and (public.is_admin() or (public.is_technician() and j.technician_id = auth.uid()))
));

drop policy if exists repair_evidence_upload on storage.objects;
create policy repair_evidence_upload on storage.objects for insert to authenticated
with check (bucket_id = 'repair-evidence' and public.is_technician() and exists (
  select 1 from public.jobs j where j.id::text = (storage.foldername(name))[1]
    and j.status = 'active' and j.technician_id = auth.uid()
));

-- Only unlinked uploads may be cleaned up; saved repair evidence is retained.
drop policy if exists repair_evidence_cleanup on storage.objects;
create policy repair_evidence_cleanup on storage.objects for delete to authenticated
using (bucket_id = 'repair-evidence' and public.is_technician() and exists (
  select 1 from public.jobs j where j.id::text = (storage.foldername(name))[1]
    and j.technician_id = auth.uid()
    and not exists (select 1 from jsonb_array_elements(j.repair_photos) p where p->>'path' = name)
));

create or replace function public.attach_job_repair_photo(p_job_id uuid, p_path text)
returns public.jobs language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_object storage.objects;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id
     or v_job.status <> 'active' then
    raise exception 'Only the assigned technician can add photos to an active job.';
  end if;
  select * into v_object from storage.objects
    where bucket_id = 'repair-evidence' and name = p_path;
  if not found or split_part(p_path, '/', 1) <> p_job_id::text
     or coalesce(v_object.metadata->>'mimetype', '') not in ('image/jpeg', 'image/png')
     or coalesce((v_object.metadata->>'size')::bigint, 0) not between 1 and 10485760 then
    raise exception 'Upload a JPG or PNG photo up to 10 MB for this job first.';
  end if;
  -- Row lock and deduplication make retries and concurrent uploads safe.
  if not exists (select 1 from jsonb_array_elements(v_job.repair_photos) p where p->>'path' = p_path) then
    update public.jobs set repair_photos = repair_photos || jsonb_build_array(jsonb_build_object(
      'path', p_path, 'contentType', v_object.metadata->>'mimetype',
      'size', (v_object.metadata->>'size')::bigint, 'uploadedAt', now(), 'uploadedBy', auth.uid()
    )) where id = p_job_id returning * into v_job;
  end if;
  return v_job;
end;
$$;
revoke all on function public.attach_job_repair_photo(uuid, text) from public;
grant execute on function public.attach_job_repair_photo(uuid, text) to authenticated;

commit;
