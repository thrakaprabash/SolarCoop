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
  'resolution_notes, source, created_at, accepted_at, completed_at, updated_at';

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
