/**
 * src/admin/services/alertScanService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The "on-demand scan" that raises automatic alerts — SOL-157, item 3c.
 *
 * Runs in the ADMIN's session when the admin portal opens, on pull-to-refresh
 * on the Alerts screen, and from its Scan button. There is no background job:
 * if no admin opens the app, nothing is evaluated. (A production system would
 * run this on a schedule; see alert_system_plan.md §5.)
 *
 * The scan:
 *   1. loads what alerts already exist (for de-duplication),
 *   2. loads members, energy readings, transactions, pending requests and open
 *      complaints — each independently, so one failing query only disables the
 *      checks that need it,
 *   3. runs the pure rules in alertRules.js over that data,
 *   4. inserts whichever candidates aren't already covered by an existing alert.
 *
 * De-duplication has two layers: shouldRaise() in the rules (open alert,
 * cooldown after resolve, once-only for specific events), and a partial unique
 * index on alerts.dedupe_key (0005_alert_scan_support.sql) as the backstop when
 * two scans race — the loser's insert is rejected with a unique violation,
 * which is treated as "already there", not as an error.
 *
 * Alerts are inserted with source = 'system', so the admin app shows them as
 * read-only apart from resolve / reopen. Recovery closes handled conditions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../lib/supabase';
import { toUIStatus } from './adminMemberService';
import { toDBSeverity } from './adminAlertService';
import { runChecks, shouldRaise, recoveredAlertIds } from './alertRules';
import { fetchPages } from './pagination';

const num = (value) => Number(value ?? 0);

// ─── Fetches ──────────────────────────────────────────────────────────────────

/** Alerts already raised by a scan, keyed by dedupe_key. Failure aborts the scan. */
async function fetchExistingAlerts() {
  const data = await fetchPages(() => supabase
    .from('alerts')
    .select('id, dedupe_key, status, created_at, resolved_at, auto_resolved')
    .not('dedupe_key', 'is', null)
    .eq('source', 'system')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }));

  const byKey = new Map();
  for (const row of data ?? []) {
    const list = byKey.get(row.dedupe_key) ?? [];
    list.push({ id: row.id, status: row.status, at: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null, autoResolved: row.auto_resolved });
    byKey.set(row.dedupe_key, list);
  }
  return byKey;
}

async function fetchMembers() {
  const data = await fetchPages(() => supabase
    .from('profiles')
    .select('id, name, household_id, status, created_at')
    .neq('role', 'admin')
    .order('id'));

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? 'Unknown Member',
    household: p.household_id ?? null,
    status: toUIStatus(p.status),
    createdAt: new Date(p.created_at),
  }));
}

/** Read every page so high-frequency simulation cannot hide older households. */
async function fetchReadings() {
  const data = await fetchPages(() => supabase
    .from('energy_records')
    .select('id, user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at, is_simulated')
    .order('recorded_at', { ascending: false })
    .order('id', { ascending: false }));

  const byUser = new Map();
  for (const r of data ?? []) {
    const at = new Date(r.recorded_at);
    if (Number.isNaN(at.getTime())) continue;

    const production = num(r.production_kwh);
    const consumption = num(r.consumption_kwh);
    const reading = {
      production,
      consumption,
      surplus: r.surplus_kwh != null ? num(r.surplus_kwh) : production - consumption,
      at,
      isSimulated: r.is_simulated === true,
    };

    const list = byUser.get(r.user_id) ?? [];
    list.push(reading);
    byUser.set(r.user_id, list);
  }
  return byUser;
}

async function fetchTransactions() {
  const data = await fetchPages(() => supabase
    .from('transactions')
    .select('id, sender_id, receiver_id, energy_amount, reference_code, status, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }));

  return (data ?? []).map((t) => ({
    id: t.id,
    senderId: t.sender_id,
    receiverId: t.receiver_id,
    amount: num(t.energy_amount),
    referenceCode: t.reference_code,
    status: t.status,
    at: new Date(t.created_at),
  }));
}

async function fetchPendingRequests() {
  const data = await fetchPages(() => supabase
    .from('energy_requests')
    .select('id, requester_id, provider_id, amount_requested_kwh, created_at')
    .eq('status', 'PENDING')
    .order('id'));

  return (data ?? []).map((r) => ({
    id: String(r.id),
    requesterId: r.requester_id,
    providerId: r.provider_id,
    amount: num(r.amount_requested_kwh),
    at: new Date(r.created_at),
  }));
}

async function fetchOpenComplaints() {
  const data = await fetchPages(() => supabase
    .from('complaints')
    .select('id, user_id, type, status, submitted_at')
    .in('status', ['open', 'under_review'])
    .order('id'));

  return (data ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    type: c.type,
    status: c.status,
    at: new Date(c.submitted_at),
  }));
}

// ─── The scan ─────────────────────────────────────────────────────────────────

/**
 * Evaluate every rule and raise the alerts that aren't already covered.
 *
 * @returns {Promise<{
 *   raised: number,        // new alerts inserted
 *   evaluated: number,     // conditions currently true (before de-duplication)
 *   failedChecks: {check: string, reason: string}[]
 * }>}
 * @throws {Error} If existing alerts can't be read (e.g. migration 0005 hasn't
 *   been run) — the scan refuses to run rather than risk raising duplicates.
 */
export async function scanForSystemAlerts() {
  const now = new Date();

  // Without this we can't tell what's already been raised, so nothing below is safe.
  const existing = await fetchExistingAlerts();

  const unavailable = new Map(); // fetch name → error message
  const load = async (name, fetcher) => {
    try {
      return await fetcher();
    } catch (err) {
      unavailable.set(name, err?.message || 'query failed');
      return null;
    }
  };

  const [members, readingsByUser, transactions, pendingRequests, complaints] = await Promise.all([
    load('members', fetchMembers),
    load('readings', fetchReadings),
    load('transactions', fetchTransactions),
    load('requests', fetchPendingRequests),
    load('complaints', fetchOpenComplaints),
  ]);

  const { candidates, failedChecks } = runChecks(
    { members, readingsByUser, transactions, pendingRequests, complaints },
    unavailable,
    now
  );

  const toRaise = candidates.filter((c) => shouldRaise(c, existing, now));

  let resolved = 0;
  const recovered = recoveredAlertIds(existing, candidates, failedChecks);
  for (let offset = 0; offset < recovered.length; offset += 100) {
    const { data, error } = await supabase.from('alerts')
      .update({ status: 'resolved', auto_resolved: true })
      .in('id', recovered.slice(offset, offset + 100))
      .eq('status', 'active').eq('source', 'system').select('id');
    if (error) failedChecks.push({ check: 'recovery', reason: error.message });
    else resolved += data?.length ?? 0;
  }

  let raised = 0;
  const saveErrors = [];

  await Promise.all(
    toRaise.map(async (c) => {
      const { error } = await supabase.from('alerts').insert({
        alert_type: c.type,
        user_id: c.userId,
        message: c.message,
        severity: toDBSeverity(c.severity),
        source: 'system',
        dedupe_key: c.dedupeKey,
      });

      if (!error) raised += 1;
      else if (error.code !== '23505') saveErrors.push(error.message); // 23505 = another scan got there first
    })
  );

  if (saveErrors.length > 0) {
    failedChecks.push({
      check: 'save',
      reason: `${saveErrors.length} alert(s) could not be saved: ${saveErrors[0]}`,
    });
  }

  return { raised, resolved, evaluated: candidates.length, failedChecks };
}
