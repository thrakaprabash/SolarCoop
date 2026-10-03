/**
 * src/technician/services/jobService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase query layer for technician job tickets (Epic 9 / SOL-191).
 *
 * Schema: supabase/migrations/0006_technician_jobs.sql
 *   jobs: id, ticket_code, household_user_id, client_name, client_phone,
 *         site_address, site_area, distance_km, title, device, error_code,
 *         error_message, fault_location, urgency (urgent|medium|low),
 *         diagnostic_checklist (jsonb [{label, done}]), consumer_message,
 *         status (pending|active|completed), technician_id, technician_name,
 *         resolution_notes, source, complaint_id, created_at, accepted_at,
 *         completed_at, updated_at
 *
 * RLS: technicians read every job and update unassigned or their own ones;
 * a household reads only its own jobs.
 *
 * All functions are pure async utilities — no React state, no UI imports.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../lib/supabase';

export const JOB_COLUMNS =
  'id, ticket_code, household_user_id, client_name, client_phone, site_address, site_area, ' +
  'distance_km, title, device, error_code, error_message, fault_location, urgency, ' +
  'diagnostic_checklist, consumer_message, status, technician_id, technician_name, ' +
  'resolution_notes, repair_photos, source, created_at, accepted_at, completed_at, updated_at';

// ─── Job Shape Builder ────────────────────────────────────────────────────────

const normaliseChecklist = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .filter((item) => item && typeof item.label === 'string')
    .map((item) => ({ label: item.label, done: Boolean(item.done) }));

/** Normalise a jobs row into the camelCase shape every screen uses. */
export function buildJob(row) {
  return {
    id:              row.id,
    ticketCode:      row.ticket_code,
    householdUserId: row.household_user_id,
    clientName:      row.client_name,
    clientPhone:     row.client_phone,
    siteAddress:     row.site_address,
    siteArea:        row.site_area,
    distanceKm:      row.distance_km == null ? null : Number(row.distance_km),
    title:           row.title,
    device:          row.device,
    errorCode:       row.error_code,
    errorMessage:    row.error_message,
    faultLocation:   row.fault_location,
    urgency:         row.urgency,
    checklist:       normaliseChecklist(row.diagnostic_checklist),
    consumerMessage: row.consumer_message,
    status:          row.status,
    technicianId:    row.technician_id,
    technicianName:  row.technician_name,
    resolutionNotes: row.resolution_notes,
    repairPhotos:    Array.isArray(row.repair_photos) ? row.repair_photos : [],
    source:          row.source,
    createdAt:       row.created_at,
    acceptedAt:      row.accepted_at,
    completedAt:     row.completed_at,
    updatedAt:       row.updated_at,
  };
}

// ─── Technician Queries ───────────────────────────────────────────────────────

/**
 * The technician's board: every unassigned pending job, plus every job this
 * technician has accepted or completed. Other technicians' work is left out.
 *
 * @param {string} technicianId - auth user id of the signed-in technician
 * @returns {Promise<object[]>} newest first
 */
export async function fetchTechnicianJobs(technicianId) {
  if (!technicianId) throw new Error('Technician ID is required to load jobs.');

  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .or(`status.eq.pending,technician_id.eq.${technicianId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(buildJob);
}

/**
 * Accept a pending job: Pending → Active, assigned to this technician.
 *
 * The `status = 'pending'` filter makes this first-come-first-served — if
 * another technician got there first the update matches nothing and we say
 * so, instead of silently taking the job off them.
 *
 * @param {string} jobId
 * @param {object} technician
 * @param {string} technician.id   - auth user id
 * @param {string} technician.name - shown to the household on their alert card
 * @returns {Promise<object>} the updated job
 */
export async function acceptJob(jobId, { id: technicianId, name: technicianName }) {
  if (!technicianId) throw new Error('Technician ID is required to accept a job.');

  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'active',
      technician_id: technicianId,
      technician_name: technicianName || null,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select(JOB_COLUMNS)
    .single();

  if (error) {
    // PGRST116 = .single() matched zero rows: already accepted, or gone.
    if (error.code === 'PGRST116') {
      throw new Error('This job has already been accepted by another technician.');
    }
    throw error;
  }
  return buildJob(data);
}

/**
 * Save the diagnostic checklist (SOL-198). The whole array is written, which
 * is fine: only the assigned technician can update the job (RLS), so there's
 * no one else editing it concurrently.
 *
 * @param {string} jobId
 * @param {{label: string, done: boolean}[]} checklist
 * @returns {Promise<object>} the updated job
 */
export async function updateChecklist(jobId, checklist) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ diagnostic_checklist: checklist.map(({ label, done }) => ({ label, done })) })
    .eq('id', jobId)
    .select(JOB_COLUMNS)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Only the technician assigned to this job can update its checklist.');
    }
    throw error;
  }
  return buildJob(data);
}

/**
 * Close a job: Active → Completed (SOL-201). Only the assigned technician's
 * active job matches; the household's alert card reads the same row, so it
 * flips to "maintenance complete" as soon as this lands.
 *
 * @param {string} jobId
 * @param {object} closure
 * @param {string} closure.resolutionNotes
 * @param {{label: string, done: boolean}[]} closure.checklist
 * @returns {Promise<object>} the updated job
 */
export async function completeJob(jobId, { resolutionNotes, checklist }) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      resolution_notes: resolutionNotes.trim(),
      diagnostic_checklist: checklist.map(({ label, done }) => ({ label, done })),
    })
    .eq('id', jobId)
    .eq('status', 'active')
    .select(JOB_COLUMNS)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('This job is no longer active, or it is assigned to another technician.');
    }
    throw error;
  }
  return buildJob(data);
}

/**
 * Subscribe to every change on public.jobs the signed-in user may see (RLS
 * applies to Realtime). Requires migration 0007_jobs_realtime.sql.
 *
 * @param {string}   channelName - unique per subscriber
 * @param {function} onChange    - receives the raw Realtime payload
 * @param {string}   [filter]    - optional Realtime filter, e.g. 'household_user_id=eq.<uuid>'
 * @returns {function} unsubscribe
 */
export function subscribeToJobs(channelName, onChange, filter) {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jobs', ...(filter ? { filter } : {}) },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Past completed jobs at one household — the Maintenance History timeline
 * on the Diagnostic Dossier. Most recent first.
 *
 * @param {string} householdUserId - jobs.household_user_id
 * @param {string} [excludeJobId]  - the job being viewed, left out of its own history
 * @returns {Promise<object[]>}
 */
export async function fetchHouseholdHistory(householdUserId, excludeJobId = null) {
  if (!householdUserId) return [];

  let query = supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('household_user_id', householdUserId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10);

  if (excludeJobId) query = query.neq('id', excludeJobId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(buildJob);
}
