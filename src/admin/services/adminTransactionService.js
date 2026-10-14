/**
 * src/admin/services/adminTransactionService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase query layer for the Admin Transaction Monitoring feature (SOL-155).
 *
 * Real Supabase schema (confirmed, supabase/migrations/0001_trade_schema.sql):
 *   transactions: id (uuid), request_id (bigint, nullable),
 *                 sender_id (uuid → profiles.id), receiver_id (uuid → profiles.id),
 *                 energy_amount (numeric), status (text — CHECK constrained to
 *                 'COMPLETED' | 'REVERSED' only), reference_code (text),
 *                 created_at (timestamptz)
 *
 * The schema has no PENDING/FAILED state: a row is only ever created once a
 * trade is completed. "Reverse" is therefore the one real admin action the
 * database allows — the old three-state Pending/Failed/Completed UI
 * vocabulary has been replaced with the two states that actually exist.
 *
 * All functions are pure async utilities — no React state, no UI imports.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../lib/supabase';
import { fetchPages } from './pagination';

const TX_COLUMNS = 'id, sender_id, receiver_id, energy_amount, status, reference_code, created_at, reversed_at, reversed_by, reversal_reason';

// ─── Status Vocabulary Mapper ─────────────────────────────────────────────────
const DB_TO_UI_STATUS = {
  COMPLETED: 'Completed',
  REVERSED: 'Reversed',
};

const UI_TO_DB_STATUS = {
  Completed: 'COMPLETED',
  Reversed: 'REVERSED',
};

export const toUITxStatus = (dbStatus) => DB_TO_UI_STATUS[dbStatus] ?? 'Completed';
export const toDBTxStatus = (uiStatus) => UI_TO_DB_STATUS[uiStatus] ?? 'COMPLETED';

// ─── Transaction Shape Builder ────────────────────────────────────────────────

/**
 * Build a normalised transaction object from a transactions row + a
 * sender_id/receiver_id → profile lookup map.
 *
 * @param {object} row           - Row from public.transactions
 * @param {object} profilesById  - { [profileId]: { id, name } }
 */
function buildTransaction(row, profilesById) {
  const sender = profilesById[row.sender_id];
  const receiver = profilesById[row.receiver_id];

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    sender: sender?.name ?? 'Unknown Member',
    receiver: receiver?.name ?? 'Unknown Member',
    amount: Number(row.energy_amount ?? 0),
    status: toUITxStatus(row.status),
    referenceCode: row.reference_code,
    timestamp: row.created_at,
    reversedAt: row.reversed_at,
    reversedBy: row.reversed_by,
    reversedByName: profilesById[row.reversed_by]?.name ?? null,
    reversalReason: row.reversal_reason,
  };
}

/**
 * Resolve { id, name } for every profile id referenced by a set of
 * transaction rows, as a lookup map keyed by id.
 */
async function resolveProfiles(profileIds) {
  const ids = [...new Set(profileIds.filter(Boolean))];
  const profiles = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    profiles.push(...await fetchPages(() => supabase.from('profiles').select('id, name')
      .in('id', ids.slice(offset, offset + 100)).order('id')));
  }
  return Object.fromEntries(profiles.map(p => [p.id, p]));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch every transaction, newest first, with sender/receiver names resolved.
 *
 * Strategy (two sequential queries, joined client-side — same pattern as
 * adminMemberService.fetchAllMembers): sender and receiver are two different
 * foreign keys to the same table, which PostgREST can't resolve as two
 * distinct embedded relationships in one call without an explicit FK hint,
 * so names are resolved separately here instead.
 *
 * @returns {Promise<object[]>} Array of normalised transaction objects
 */
export async function fetchAllTransactions() {
  const transactions = await fetchPages(() => supabase
    .from('transactions')
    .select(TX_COLUMNS)
    .order('created_at', { ascending: false }).order('id', { ascending: false }));
  if (!transactions || transactions.length === 0) return [];

  const profileIds = [...new Set(transactions.flatMap((t) => [t.sender_id, t.receiver_id, t.reversed_by]))];
  const profilesById = await resolveProfiles(profileIds);

  return transactions.map((row) => buildTransaction(row, profilesById));
}

/**
 * Fetch transactions where the given member is either sender or receiver.
 * Used by MemberDetailScreen's "Recent Transactions" section.
 *
 * @param {string} memberId - profiles.id (uuid)
 * @param {number} limit
 * @returns {Promise<object[]>} Array of normalised transaction objects
 */
export async function fetchTransactionsForMember(memberId, limit = 5) {
  const { data: transactions, error: txErr } = await supabase
    .from('transactions')
    .select(TX_COLUMNS)
    .or(`sender_id.eq.${memberId},receiver_id.eq.${memberId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (txErr) throw txErr;
  if (!transactions || transactions.length === 0) return [];

  const profileIds = [...new Set(transactions.flatMap((t) => [t.sender_id, t.receiver_id, t.reversed_by]))];
  const profilesById = await resolveProfiles(profileIds);

  return transactions.map((row) => buildTransaction(row, profilesById));
}

/**
 * Reverse a completed transaction. This is the only status transition the
 * database allows an admin to make (the CHECK constraint only permits
 * COMPLETED/REVERSED, and there is no "un-reverse").
 *
 * @param {string} transactionId - transactions.id (uuid)
 * @param {string} reason - 10–500 character explanation, enforced server-side
 * @returns {Promise<object>} The updated transaction, normalised for the UI
 * @throws {Error} On Supabase write failure
 */
export async function reverseTransaction(transactionId, reason) {
  const { data, error } = await supabase
    .rpc('admin_reverse_transaction', { p_transaction_id: transactionId, p_reason: reason })
    .single();

  if (error) throw error;

  const profilesById = await resolveProfiles([data.sender_id, data.receiver_id, data.reversed_by]);
  return buildTransaction(data, profilesById);
}
