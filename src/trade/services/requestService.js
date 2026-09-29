import { supabase } from '../../lib/supabase';

const REQUEST_COLUMNS =
  'id, requester_id, provider_id, amount_requested_kwh, status, created_at';

const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const requestDate = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const requestDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
};

const requestStatus = (status) => STATUS_LABELS[String(status || '').toUpperCase()] || 'Unknown';

const requestTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Fetch only the signed-in member's submitted requests, newest first. */
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
  const providerById = new Map((providers || []).map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const provider = providerById.get(row.provider_id);
    return {
      id: String(row.id),
      providerId: row.provider_id,
      name: provider?.name || 'Household',
      kwh: Number(row.amount_requested_kwh),
      // No price snapshot is stored on energy_requests; avoid displaying a
      // historical cost calculated using the provider's current rate.
      rate: null,
      ts: requestTimestamp(row.created_at),
      date: requestDate(row.created_at),
      status: requestStatus(row.status),
    };
  });
}

/** Read requests addressed to the signed-in provider. */
export async function fetchIncomingRequests(providerId) {
  if (!providerId) return [];

  const { data: rows, error: requestsError } = await supabase
    .from('energy_requests')
    .select(REQUEST_COLUMNS)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (requestsError) throw requestsError;
  if (!rows?.length) return [];

  const requesterIds = [...new Set(rows.map((row) => row.requester_id).filter(Boolean))];
  let requesters = [];
  if (requesterIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', requesterIds);
    if (error) throw error;
    requesters = data || [];
  }

  const requesterById = new Map(requesters.map((profile) => [profile.id, profile]));
  return rows.map((row) => {
    const name = requesterById.get(row.requester_id)?.name || 'Community Member';
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');

    return {
      id: String(row.id),
      requesterId: row.requester_id,
      providerId: row.provider_id,
      name,
      initials,
      kwh: Number(row.amount_requested_kwh),
      ts: requestTimestamp(row.created_at),
      when: requestDateTime(row.created_at),
      status: requestStatus(row.status),
    };
  });
}

function requestIdNumber(requestId) {
  const id = Number(requestId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid request ID.');
  }
  return id;
}

/** The guarded database operation also creates the completed transaction. */
export async function approveRequest(requestId) {
  const { data, error } = await supabase.rpc('trade_approve_request', {
    p_request_id: requestIdNumber(requestId),
  });
  if (error) throw error;
  return data;
}

/** Reject a pending request without creating a transaction. */
export async function rejectRequest(requestId) {
  const { data, error } = await supabase.rpc('trade_reject_request', {
    p_request_id: requestIdNumber(requestId),
  });
  if (error) throw error;
  return data;
}
