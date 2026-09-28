/**
 * src/admin/services/adminAlertService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase query layer for the Admin Alert Management feature (SOL-157).
 *
 * Real Supabase schema (supabase/migrations/0002_alerts_and_admin_rls.sql):
 *   alerts: id (uuid), alert_type (text), user_id (uuid → profiles.id, nullable —
 *           null means community-wide), message (text),
 *           severity (text: low | medium | high | critical),
 *           status   (text: active | resolved | dismissed),
 *           source   (text: admin | system — added in 0003_alert_source.sql),
 *           created_at (timestamptz)
 *
 * Admin RLS (`admin_write_alerts`) allows full read/insert/update/delete; a
 * member can only read their own or community-wide rows.
 *
 * Editing rule: only alerts with source = 'admin' can have their message or
 * severity changed (see updateAlert). System-raised alerts are a record of
 * what the detector saw; admins can still resolve, reopen or delete them.
 *
 * All functions are pure async utilities — no React state, no UI imports.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../lib/supabase';

const ALERT_COLUMNS = 'id, alert_type, user_id, message, severity, status, source, created_at';

// ─── Alert Type Registry ──────────────────────────────────────────────────────
//
// The single source of truth for what kinds of alert exist. `alert_type` is a
// free-text column, so this registry is what gives a raw key like
// 'zero_production' a display label, a filterable category, and a sensible
// default severity. Anything the registry doesn't know still renders (label
// falls back to a humanised key, category to 'Other') so an unrecognised row
// never breaks the inbox.

export const ALERT_CATEGORIES = ['Energy', 'Transactions', 'Members', 'Complaints', 'System', 'Notice'];

export const ALERT_TYPES = {
  zero_production:       { label: 'Zero Production',             category: 'Energy',       severity: 'High'   },
  low_production:        { label: 'Low Production',              category: 'Energy',       severity: 'Medium' },
  consumption_spike:     { label: 'Consumption Spike',           category: 'Energy',       severity: 'Medium' },
  community_surplus_low: { label: 'Low Community Surplus',       category: 'Energy',       severity: 'High'   },
  community_deficit:     { label: 'Sustained Community Deficit', category: 'Energy',       severity: 'Medium' },
  transaction_reversed:  { label: 'Transaction Reversed',        category: 'Transactions', severity: 'Medium' },
  large_transaction:     { label: 'Unusually Large Transaction', category: 'Transactions', severity: 'Low'    },
  request_pending:       { label: 'Request Stuck Pending',       category: 'Transactions', severity: 'Low'    },
  signup_pending:        { label: 'Signup Awaiting Approval',    category: 'Members',      severity: 'Low'    },
  member_silent:         { label: 'Member Gone Silent',          category: 'Members',      severity: 'Low'    },
  complaint_new:         { label: 'New Complaint',               category: 'Complaints',   severity: 'Medium' },
  complaint_aging:       { label: 'Complaint Aging',             category: 'Complaints',   severity: 'Medium' },
  stale_data:            { label: 'Stale Energy Data',           category: 'System',       severity: 'Medium' },
  system_error:          { label: 'System Error',                category: 'System',       severity: 'High'   },
  admin_notice:          { label: 'Admin Notice',                category: 'Notice',       severity: 'Medium' },
};

const humanise = (key) =>
  String(key ?? 'Alert')
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// ─── Severity / Status Vocabulary Mappers ─────────────────────────────────────
//
// The UI shows 'Critical' | 'High' | 'Medium' | 'Low' and 'Open' | 'Resolved' |
// 'Dismissed'; the database stores lowercase severity and 'active' for open.
// This is the only place that translation lives.

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const DB_TO_UI_SEVERITY = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const UI_TO_DB_SEVERITY = { Low: 'low', Medium: 'medium', High: 'high', Critical: 'critical' };

const DB_TO_UI_STATUS = { active: 'Open', resolved: 'Resolved', dismissed: 'Dismissed' };

export const toUISeverity = (dbSeverity) => DB_TO_UI_SEVERITY[dbSeverity] ?? 'Medium';
export const toDBSeverity = (uiSeverity) => UI_TO_DB_SEVERITY[uiSeverity] ?? 'medium';
export const toUIAlertStatus = (dbStatus) => DB_TO_UI_STATUS[dbStatus] ?? 'Open';

// ─── Alert Shape Builder ──────────────────────────────────────────────────────

/**
 * Build a normalised alert object from an alerts row + a profile lookup map.
 *
 * @param {object} row          - Row from public.alerts
 * @param {object} profilesById - { [profileId]: { id, name, household_id } }
 */
function buildAlert(row, profilesById = {}) {
  const meta = ALERT_TYPES[row.alert_type];
  const profile = row.user_id ? profilesById[row.user_id] : null;

  return {
    id: row.id,
    type: row.alert_type,
    typeLabel: meta?.label ?? humanise(row.alert_type),
    category: meta?.category ?? 'Other',
    severity: toUISeverity(row.severity),
    status: toUIAlertStatus(row.status),
    message: row.message,
    userId: row.user_id,
    member: row.user_id ? (profile?.name ?? 'Unknown Member') : 'Community',
    household: profile?.household_id ?? null,
    source: row.source ?? 'admin',
    canEdit: (row.source ?? 'admin') === 'admin',
    timestamp: row.created_at,
  };
}

/**
 * Resolve { id, name, household_id } for every member an alert targets.
 * Names are secondary to the alerts themselves, so a lookup failure is
 * non-fatal — alerts still load, with 'Unknown Member' as the label.
 */
async function resolveProfiles(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, household_id')
    .in('id', ids);

  if (error) {
    console.warn('[adminAlertService] Profile lookup failed:', error.message);
    return {};
  }

  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch every alert, newest first, with the targeted member's name resolved.
 *
 * @returns {Promise<object[]>} Array of normalised alert objects
 */
export async function fetchAllAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select(ALERT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const profilesById = await resolveProfiles(rows.map((r) => r.user_id));
  return rows.map((row) => buildAlert(row, profilesById));
}

/**
 * Create an alert. `userId` null = community-wide.
 *
 * @param {object}      params
 * @param {string}      params.type      - A key of ALERT_TYPES (or any string)
 * @param {string}      params.message
 * @param {string}      params.severity  - 'Critical' | 'High' | 'Medium' | 'Low'
 * @param {string|null} [params.userId]  - profiles.id to target, or null
 * @returns {Promise<object>} The created alert, normalised for the UI
 * @throws {Error} On Supabase write failure
 */
export async function createAlert({ type, message, severity, userId = null }) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      alert_type: type,
      message: message.trim(),
      severity: toDBSeverity(severity),
      user_id: userId,
      source: 'admin',
    })
    .select(ALERT_COLUMNS)
    .single();

  if (error) throw error;

  const profilesById = await resolveProfiles([data.user_id]);
  return buildAlert(data, profilesById);
}

/**
 * Move an alert to a new status. Returns just the new status — the caller
 * already holds the rest of the alert, so re-fetching the member name would
 * be waste.
 */
async function setAlertStatus(alertId, dbStatus) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status: dbStatus })
    .eq('id', alertId)
    .select('id, status')
    .single();

  if (error) throw error;
  return { id: data.id, status: toUIAlertStatus(data.status) };
}

/**
 * Mark an alert resolved. Allowed on every alert, admin- or system-raised.
 *
 * @param {string} alertId - alerts.id (uuid)
 * @returns {Promise<{ id: string, status: string }>}
 * @throws {Error} On Supabase write failure, or if the row wasn't updated
 */
export async function resolveAlert(alertId) {
  return setAlertStatus(alertId, 'resolved');
}

/**
 * Reopen a resolved alert — the undo for a misclicked Resolve. Status is
 * workflow, not content, so this is allowed on every alert too.
 *
 * @param {string} alertId - alerts.id (uuid)
 * @returns {Promise<{ id: string, status: string }>}
 * @throws {Error} On Supabase write failure, or if the row wasn't updated
 */
export async function reopenAlert(alertId) {
  return setAlertStatus(alertId, 'active');
}

/**
 * Edit an admin-created alert's message and severity. Type and recipient are
 * deliberately not editable: type drives category filtering and the planned
 * duplicate check, and silently retargeting an alert a member may have
 * already seen is confusing — delete and recreate to change either.
 *
 * The `source = 'admin'` filter is what enforces "only admin-created alerts
 * are editable": a system-raised row simply matches nothing.
 *
 * @param {string} alertId - alerts.id (uuid)
 * @param {object} changes
 * @param {string} changes.message
 * @param {string} changes.severity - 'Critical' | 'High' | 'Medium' | 'Low'
 * @returns {Promise<{ id: string, message: string, severity: string }>}
 * @throws {Error} On Supabase failure, or if the alert is gone / system-raised
 */
export async function updateAlert(alertId, { message, severity }) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ message: message.trim(), severity: toDBSeverity(severity) })
    .eq('id', alertId)
    .eq('source', 'admin')
    .select('id, message, severity')
    .single();

  if (error) {
    // PGRST116 = .single() matched zero rows: deleted, or raised by the system.
    if (error.code === 'PGRST116') {
      throw new Error('This alert can no longer be edited — it was deleted, or it was raised by the system.');
    }
    throw error;
  }

  return { id: data.id, message: data.message, severity: toUISeverity(data.severity) };
}

/**
 * Permanently delete an alert. Unlike members and complaints, a real delete
 * is right here: alerts are transient notices, not an audit record.
 *
 * RLS makes a blocked delete succeed silently with zero rows affected, so the
 * returned rows are checked rather than trusting the absence of an error.
 *
 * @param {string} alertId - alerts.id (uuid)
 * @throws {Error} On Supabase failure, or if no row was actually deleted
 */
export async function deleteAlert(alertId) {
  const { data, error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Alert was not deleted — it may already be gone, or you may not have permission.');
  }
}
