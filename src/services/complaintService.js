/**
 * src/services/complaintService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase query layer for Member Complaints & Admin Resolution workflows.
 *
 * Real Supabase schema:
 *   complaints: id (uuid), user_id (uuid), type (text), description (text),
 *               related_transaction (text), status (text), resolution_note (text),
 *               submitted_at (timestamptz), updated_at (timestamptz)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';

// ─── Status Vocabulary Mapper ─────────────────────────────────────────────────
const DB_TO_UI_STATUS = {
  open:         'Open',
  under_review: 'Under Review',
  investigated: 'Investigated',
  resolved:     'Resolved',
  rejected:     'Rejected',
};

const UI_TO_DB_STATUS = {
  'Open':         'open',
  'Under Review': 'under_review',
  'Investigated': 'investigated',
  'Resolved':     'resolved',
  'Rejected':     'rejected',
};

export const toUIStatus = (dbStatus) => DB_TO_UI_STATUS[dbStatus] ?? 'Open';
export const toDBStatus = (uiStatus) => UI_TO_DB_STATUS[uiStatus] ?? 'open';

// ─── Complaint Shape Builder ──────────────────────────────────────────────────
/**
 * Normalise a raw database complaint row (+ optionally joined profile) into the
 * shape expected by Member and Admin UIs.
 */
function buildComplaint(row, profile = null) {
  const uiStatus = toUIStatus(row.status);
  const isOpen = row.status === 'open';

  return {
    id:                 row.id,
    userId:             row.user_id,
    complainant:        profile?.name ?? row.profiles?.name ?? 'Member',
    household:          profile?.household_id ?? row.profiles?.household_id ?? '—',
    memberId:           row.user_id,
    type:               row.type,
    description:        row.description,
    relatedTransaction: row.related_transaction || null,
    relatedAmount:      null, // Calculated or joined if available
    status:             uiStatus,
    resolutionNote:     row.resolution_note || '',
    submittedAt:        row.submitted_at,
    updatedAt:          row.updated_at,
    canEdit:            isOpen,
    canDelete:          isOpen,
  };
}

// ─── Helper: Fetch profiles by array of user IDs ──────────────────────────────
async function fetchProfilesMap(userIds) {
  if (!userIds || userIds.length === 0) return {};
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, household_id')
    .in('id', uniqueIds);

  if (error) {
    console.warn('[complaintService] Profiles fetch error:', error.message);
    return {};
  }

  const map = {};
  for (const p of (profiles || [])) {
    map[p.id] = p;
  }
  return map;
}

// ─── Member Operations ────────────────────────────────────────────────────────

/**
 * Submit a new complaint as the logged-in user.
 */
export async function submitComplaint(userId, { type, description, relatedTransaction }) {
  if (!userId) throw new Error('User ID is required to submit a complaint.');

  const payload = {
    user_id:             userId,
    type:                type,
    description:         description.trim(),
    related_transaction: relatedTransaction ? relatedTransaction.trim() : null,
    status:              'open',
    submitted_at:        new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('complaints')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('[complaintService] submitComplaint DB error:', error.message);
    throw error;
  }

  return buildComplaint(data);
}

/**
 * Fetch all complaints submitted by a specific user.
 */
export async function fetchMyComplaints(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[complaintService] fetchMyComplaints DB error:', error.message);
    throw error;
  }

  return (data || []).map(row => buildComplaint(row));
}

/**
 * Edit an existing complaint (Only permitted when status = 'open').
 */
export async function editComplaint(complaintId, { type, description, relatedTransaction }) {
  const payload = {
    type:                type,
    description:         description.trim(),
    related_transaction: relatedTransaction ? relatedTransaction.trim() : null,
    updated_at:          new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('complaints')
    .update(payload)
    .eq('id', complaintId)
    .eq('status', 'open')
    .select()
    .single();

  if (error) {
    console.error('[complaintService] editComplaint DB error:', error.message);
    throw error;
  }

  return buildComplaint(data);
}

/**
 * Delete a complaint (Only permitted when status = 'open').
 */
export async function deleteComplaint(complaintId) {
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId)
    .eq('status', 'open');

  if (error) {
    console.error('[complaintService] deleteComplaint DB error:', error.message);
    throw error;
  }

  return true;
}

// ─── Admin Operations ─────────────────────────────────────────────────────────

/**
 * Fetch all complaints with complainant profile details joined client-side.
 */
export async function fetchAllComplaints() {
  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[complaintService] fetchAllComplaints DB error:', error.message);
    throw error;
  }

  if (!complaints || complaints.length === 0) return [];

  const userIds = complaints.map(c => c.user_id);
  const profilesMap = await fetchProfilesMap(userIds);

  return complaints.map(row => buildComplaint(row, profilesMap[row.user_id]));
}

/**
 * Update the status of a complaint (Admin only).
 */
export async function updateComplaintStatus(complaintId, uiStatus) {
  const dbStatus = toDBStatus(uiStatus);

  const { data, error } = await supabase
    .from('complaints')
    .update({
      status:     dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('[complaintService] updateComplaintStatus DB error:', error.message);
    throw error;
  }

  const profilesMap = await fetchProfilesMap([data.user_id]);
  return buildComplaint(data, profilesMap[data.user_id]);
}

/**
 * Create or edit the resolution note on a complaint (Admin only).
 */
export async function saveResolutionNote(complaintId, note) {
  const { data, error } = await supabase
    .from('complaints')
    .update({
      resolution_note: note ? note.trim() : '',
      updated_at:      new Date().toISOString(),
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('[complaintService] saveResolutionNote DB error:', error.message);
    throw error;
  }

  const profilesMap = await fetchProfilesMap([data.user_id]);
  return buildComplaint(data, profilesMap[data.user_id]);
}

/**
 * Clear/delete the resolution note on a complaint (Admin only).
 */
export async function clearResolutionNote(complaintId) {
  const { data, error } = await supabase
    .from('complaints')
    .update({
      resolution_note: null,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('[complaintService] clearResolutionNote DB error:', error.message);
    throw error;
  }

  const profilesMap = await fetchProfilesMap([data.user_id]);
  return buildComplaint(data, profilesMap[data.user_id]);
}
