/**
 * src/services/faultAlertService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Household-side view of technician job tickets (SOL-199).
 *
 * Reads the same public.jobs rows the Technician Portal works from, but only
 * plain-language messages. The error code is used only to choose localized
 * telemetry copy; raw codes, locations and checklists are not displayed.
 * RLS (`household_read_own_jobs`)
 * limits the rows to the member's own jobs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';

const CONSUMER_JOB_COLUMNS =
  'id, status, consumer_message, technician_name, accepted_at, completed_at, created_at, updated_at, source, error_code';

// A finished job stays on the card this long, so the household sees
// "maintenance complete" rather than the card silently vanishing (SOL-201).
const SHOW_COMPLETED_FOR_MS = 24 * 60 * 60 * 1000;

function buildFaultAlert(row) {
  return {
    id:        row.id,
    status:    row.status, // 'pending' | 'active' | 'completed'
    message:   row.consumer_message,
    messageKey: row.source === 'telemetry' && /^E0[1-8]$/.test(row.error_code || '')
      ? `faultAlert.telemetry.${row.error_code}` : null,
    // SOL-200 — set when a technician accepts the job; null while pending.
    technicianName: row.technician_name,
    acceptedAt:     row.accepted_at,
    completedAt:    row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maintenance jobs at the member's household that are open, or finished in
 * the last 24 hours, newest first.
 *
 * @param {string} userId - auth user id of the signed-in member
 * @returns {Promise<object[]>}
 */
export async function fetchMyFaultAlerts(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select(CONSUMER_JOB_COLUMNS)
    .eq('household_user_id', userId)
    .or(
      'status.in.(pending,active),' +
      `completed_at.gte.${new Date(Date.now() - SHOW_COMPLETED_FOR_MS).toISOString()}`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(buildFaultAlert);
}

/**
 * Live updates for the member's own jobs (SOL-201): the same row the
 * technician accepts and closes. Requires 0007_jobs_realtime.sql.
 *
 * @param {string}   userId
 * @param {function} onChange - called on any insert / update / delete
 * @returns {function} unsubscribe
 */
export function subscribeToMyFaultAlerts(userId, onChange) {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`household-jobs-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jobs', filter: `household_user_id=eq.${userId}` },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
