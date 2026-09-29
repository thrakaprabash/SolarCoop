/**
 * src/services/faultAlertService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Household-side view of technician job tickets (SOL-199).
 *
 * Reads the same public.jobs rows the Technician Portal works from, but only
 * the plain-language columns. Error codes, fault locations and checklists are
 * deliberately NOT selected — a household member should see "maintenance is
 * scheduled", not "Error F05: DC Arc Fault". RLS (`household_read_own_jobs`)
 * limits the rows to the member's own jobs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';

const CONSUMER_JOB_COLUMNS = 'id, status, consumer_message, created_at, updated_at';

function buildFaultAlert(row) {
  return {
    id:        row.id,
    status:    row.status, // 'pending' | 'active'
    message:   row.consumer_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Open maintenance jobs at the member's household (pending or in progress),
 * newest first.
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
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(buildFaultAlert);
}
