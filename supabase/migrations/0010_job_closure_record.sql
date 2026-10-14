-- SOL-204: Run after 0009. Closing uses the current saved checklist and photos,
-- records a permanent snapshot, and updates the household notification in one transaction.
begin;

alter table public.jobs add column if not exists closure_record jsonb
  check (closure_record is null or jsonb_typeof(closure_record) = 'object');

create or replace function public.record_job_closure()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Allow the existing ON DELETE SET NULL foreign key to unlink a removed profile;
  -- the technician identity remains in the permanent closure snapshot.
  if old.status = 'completed' then
    if new.status is distinct from old.status
       or new.closure_record is distinct from old.closure_record
       or new.repair_photos is distinct from old.repair_photos
       or new.diagnostic_checklist is distinct from old.diagnostic_checklist
       or new.resolution_notes is distinct from old.resolution_notes
       or (new.technician_id is distinct from old.technician_id and not (
         new.technician_id is null and not exists (select 1 from public.profiles where id = old.technician_id)
       ))
       or new.technician_name is distinct from old.technician_name
       or new.completed_at is distinct from old.completed_at then
      raise exception 'Completed repair records cannot be changed.';
    end if;
    return new;
  end if;

  if new.status = 'completed' then
    if old.status <> 'active' or not public.is_technician()
       or auth.uid() is distinct from old.technician_id then
      raise exception 'Only the assigned technician can close an active job.';
    end if;
    if char_length(btrim(coalesce(new.resolution_notes, ''))) < 10
       or char_length(new.resolution_notes) > 500 then
      raise exception 'Write 10 to 500 characters describing the repair before closing.';
    end if;
    if jsonb_array_length(old.repair_photos) = 0 then
      raise exception 'Add at least one repair photo before closing this job.';
    end if;
    if exists (
      select 1 from jsonb_array_elements(old.repair_photos) p
      where not exists (
        select 1 from storage.objects o
        where o.bucket_id = 'repair-evidence' and o.name = p->>'path'
          and split_part(o.name, '/', 1) = old.id::text
          and o.metadata->>'mimetype' in ('image/jpeg', 'image/png')
          and (o.metadata->>'size')::bigint between 1 and 10485760
      )
    ) then
      raise exception 'Some repair photos are missing. Upload them again before closing.';
    end if;
    -- Never overwrite recently saved steps or evidence with an old client copy.
    new.diagnostic_checklist := old.diagnostic_checklist;
    new.repair_photos := old.repair_photos;
    new.technician_id := old.technician_id;
    new.technician_name := old.technician_name;
    new.resolution_notes := btrim(new.resolution_notes);
    new.completed_at := now();
    new.consumer_message := 'The technician has completed the repair. Thank you for your patience.';
    new.closure_record := jsonb_build_object(
      'photos', new.repair_photos, 'checklist', new.diagnostic_checklist,
      'notes', new.resolution_notes, 'completedAt', new.completed_at,
      'technicianId', new.technician_id, 'technicianName', new.technician_name
    );
  elsif new.closure_record is distinct from old.closure_record then
    raise exception 'A closure record is created only when a job is completed.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_job_closure on public.jobs;
create trigger trg_job_closure before update on public.jobs
for each row execute function public.record_job_closure();

create or replace function public.complete_job_ticket(p_job_id uuid, p_notes text)
returns public.jobs language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id then
    raise exception 'Only the assigned technician can close this job.';
  end if;
  -- A lost response can be retried without duplicating or changing the closure record.
  if v_job.status = 'completed' and v_job.closure_record is not null then
    return v_job;
  end if;
  if v_job.status <> 'active' then
    raise exception 'This job is no longer active.';
  end if;
  update public.jobs set status = 'completed', resolution_notes = p_notes
    where id = p_job_id returning * into v_job;
  return v_job;
end;
$$;
revoke all on function public.complete_job_ticket(uuid, text) from public;
grant execute on function public.complete_job_ticket(uuid, text) to authenticated;
revoke all on function public.record_job_closure() from public;

notify pgrst, 'reload schema';

commit;
