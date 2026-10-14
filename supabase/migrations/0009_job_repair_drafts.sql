-- SOL-203: Run after 0008. Save notes and toggle checklist steps on the server.
-- A row lock prevents rapid taps or two devices from losing another saved step.
begin;

create or replace function public.toggle_job_checklist_item(p_job_id uuid, p_index integer)
returns public.jobs language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
  v_done boolean;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id
     or v_job.status <> 'active' then
    raise exception 'Only the assigned technician can edit an active repair checklist.';
  end if;
  if p_index is null or p_index < 0 or p_index >= jsonb_array_length(v_job.diagnostic_checklist) then
    raise exception 'This checklist item does not exist.';
  end if;
  v_done := coalesce((v_job.diagnostic_checklist->p_index->>'done')::boolean, false);
  update public.jobs set diagnostic_checklist = jsonb_set(
    diagnostic_checklist, array[p_index::text, 'done'], to_jsonb(not v_done)
  ) where id = p_job_id returning * into v_job;
  return v_job;
end;
$$;

create or replace function public.save_job_resolution_notes(p_job_id uuid, p_notes text)
returns public.jobs language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs;
begin
  if p_notes is null or char_length(p_notes) > 500 then
    raise exception 'Repair notes must be no longer than 500 characters.';
  end if;
  update public.jobs set resolution_notes = btrim(p_notes)
    where id = p_job_id and status = 'active' and technician_id = auth.uid() and public.is_technician()
    returning * into v_job;
  if not found then
    raise exception 'Only the assigned technician can save notes for an active job.';
  end if;
  return v_job;
end;
$$;
revoke all on function public.toggle_job_checklist_item(uuid, integer) from public;
revoke all on function public.save_job_resolution_notes(uuid, text) from public;
grant execute on function public.toggle_job_checklist_item(uuid, integer) to authenticated;
grant execute on function public.save_job_resolution_notes(uuid, text) to authenticated;

commit;
