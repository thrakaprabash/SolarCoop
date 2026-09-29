import { supabase } from '../../lib/supabase';

const REQUEST_COLUMNS = 'id, requester_id, provider_id, amount_requested_kwh, status, created_at';

const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

/** Read only requests submitted by the signed-in member. */
export async function fetchMyRequests(userId) {
  if (!userId) return [];

  const { data: rows, error: requestsError } = await supabase
    .from('energy_requests')
    .select(REQUEST_COLUMNS)
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });

  if (requestsError) throw requestsError;
  if (!rows?.length) return [];

  const providerIds = [...new Set(rows.map((row) => row.provider_id).filter(Boolean))];
  let providers = [];
  if (providerIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', providerIds);
    if (error) throw error;
    providers = data || [];
  }

  const providerById = new Map(providers.map((profile) => [profile.id, profile]));
  return rows.map((row) => {
    const timestamp = new Date(row.created_at);
    const validDate = !Number.isNaN(timestamp.getTime());
    return {
      id: String(row.id),
      providerId: row.provider_id,
      name: providerById.get(row.provider_id)?.name || 'Household',
      kwh: Number(row.amount_requested_kwh),
      rate: null,
      ts: validDate ? timestamp.toISOString() : null,
      date: validDate
        ? timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Date unavailable',
      status: STATUS_LABELS[String(row.status || '').toUpperCase()] || 'Unknown',
    };
  });
}
