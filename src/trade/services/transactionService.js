import { supabase } from '../../lib/supabase';

const TRANSACTION_COLUMNS =
  'id, request_id, sender_id, receiver_id, energy_amount, status, reference_code, created_at';

async function loadProfiles(rows) {
  const ids = [...new Set(rows.flatMap((row) => [row.sender_id, row.receiver_id]).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', ids);

  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile.name]));
}

function mapTransaction(row, userId, names) {
  const sent = row.sender_id === userId;
  return {
    id: row.id,
    requestId: row.request_id == null ? null : String(row.request_id),
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    sender: names.get(row.sender_id) || 'Household',
    receiver: names.get(row.receiver_id) || 'Household',
    ref: row.reference_code,
    dir: sent ? 'sent' : 'received',
    party: names.get(sent ? row.receiver_id : row.sender_id) || 'Household',
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
