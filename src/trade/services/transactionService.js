import { supabase } from '../../lib/supabase';

const TRANSACTION_COLUMNS =
  'id, request_id, sender_id, receiver_id, energy_amount, status, reference_code, created_at';

/** Read the participant's complete ledger in pages to avoid the API row limit. */
export async function fetchMyTransactions(userId) {
  if (!userId) return [];
  const rows = [];
  const pageSize = 500;
  let cursor;
  for (;;) {
    const participant = `sender_id.eq.${userId},receiver_id.eq.${userId}`;
    // Keep both conditions in one PostgREST logic tree. Newer inserts cannot
    // shift this cursor as they would an OFFSET-based second page.
    const before = cursor && `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .or(cursor ? `and(or(${participant}),or(${before}))` : participant)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    const next = data[data.length - 1];
    if (cursor && String(next.id) === String(cursor.id)) throw new Error('Transaction pagination did not advance.');
    cursor = next;
  }
  const names = await loadProfiles(rows);
  return rows.map((row) => mapTransaction(row, userId, names));
}

async function loadProfiles(rows) {
  const ids = [...new Set(rows.flatMap((row) => [row.sender_id, row.receiver_id]).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const names = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase.from('profiles')
      .select('id, name').in('id', ids.slice(i, i + 100));
    if (error) throw error;
    (data || []).forEach((profile) => names.set(profile.id, profile.name));
  }
  return names;
}

function mapTransaction(row, userId, names) {
  const sent = row.sender_id === userId;
  return {
    id: row.id,
    requestId: row.request_id == null ? null : String(row.request_id),
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    sender: names.get(row.sender_id) || null,
    receiver: names.get(row.receiver_id) || null,
    ref: row.reference_code,
    dir: sent ? 'sent' : 'received',
    party: names.get(sent ? row.receiver_id : row.sender_id) || null,
    kwh: Number(row.energy_amount),
    ts: new Date(row.created_at).toISOString(),
    status: row.status,
  };
}

/** Read one transaction; the database RLS policy also limits it to participants. */
export async function fetchTransactionById(transactionId, userId) {
  if (!transactionId || !userId) return null;

  const { data: row, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', transactionId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const names = await loadProfiles([row]);
  return mapTransaction(row, userId, names);
}

/** Resolve a completed request to its transaction without exposing other members' rows. */
export async function fetchTransactionByRequestId(requestId, userId) {
  const id = Number(requestId);
  if (!userId || !Number.isSafeInteger(id) || id <= 0) return null;

  const { data: row, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('request_id', id)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;
  return fetchTransactionById(row.id, userId);
}
