/**
 * src/admin/services/adminMemberService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase query layer for the Admin Member Monitoring feature (CES-41).
 *
 * All functions are pure async utilities — no React state, no UI imports.
 * The member shape returned by every function matches the existing MOCK_MEMBERS
 * schema exactly, so MemberMonitoringScreen and MemberDetailScreen need only
 * swap their data source without any structural changes.
 *
 * Real Supabase schema (confirmed):
 *   profiles:       id, name, role, household_id, solar_capacity_kw,
 *                   status, created_at, updated_at, mobile_number
 *   energy_records: id, user_id, production_kwh, consumption_kwh,
 *                   surplus_kwh, recorded_at
 *
 * Note: profiles has no email column. household_id is used in its place.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../../lib/supabase';

// ─── Status Vocabulary Mapper ─────────────────────────────────────────────────
//
// The Admin UI uses:   'Active' | 'Inactive' | 'Suspended'
// The database uses:   'active' | 'inactive' | 'blocked' | 'pending_approval'
//
// This mapper is the ONLY place where this translation lives.
// Never hard-code status strings in screens or context.

const DB_TO_UI_STATUS = {
  active:           'Active',
  inactive:         'Inactive',
  blocked:          'Suspended',
  suspended:        'Suspended',
  pending_approval: 'Inactive',  // treated as inactive in admin view
  pending:          'Inactive',
};

const UI_TO_DB_STATUS = {
  Active:    'active',
  Inactive:  'pending_approval',
  Suspended: 'blocked',
};

/**
 * Convert a raw database status value to the UI display label.
 * Falls back to 'Inactive' for any unknown or null value.
 *
 * @param {string|null} dbStatus - Value from profiles.status
 * @returns {'Active'|'Inactive'|'Suspended'}
 */
export const toUIStatus = (dbStatus) =>
  DB_TO_UI_STATUS[dbStatus] ?? 'Inactive';

/**
 * Convert a UI label back to the database status value for writes.
 * Falls back to 'inactive' for any unknown value.
 *
 * @param {'Active'|'Inactive'|'Suspended'} uiStatus
 * @returns {string} - Value to write to profiles.status
 */
export const toDBStatus = (uiStatus) =>
  UI_TO_DB_STATUS[uiStatus] ?? 'inactive';

// ─── Member Shape Builder ─────────────────────────────────────────────────────

/**
 * Build a normalised member object from a profile row + its energy records.
 *
 * The returned shape matches MOCK_MEMBERS exactly so MemberMonitoringScreen
 * and MemberDetailScreen render without structural changes.
 *
 * @param {object}   profile - Row from public.profiles
 * @param {object[]} records - energy_records for this user, newest-first (≤7)
 * @returns {object}         - Normalised member object
 */
function buildMember(profile, records = []) {
  // Most recent record — used for today's production/consumption/surplus
  const latest = records[0] ?? null;

  // Last 7 records reversed to oldest→newest for the sparkline trend bars
  const last7 = [...records].slice(0, 7).reverse();
  const trend  = last7.map(r => Number(r.production_kwh ?? 0));

  // Weekly totals — sum of last 7 records
  const weeklyProduction  = last7.reduce((s, r) => s + Number(r.production_kwh  ?? 0), 0);
  const weeklyConsumption = last7.reduce((s, r) => s + Number(r.consumption_kwh ?? 0), 0);

  return {
    id:                profile.id,
    name:              profile.name ?? 'Unknown Member',
    // No email column in profiles. household_id used as identifier instead.
    email:             null,
    household:         profile.household_id ?? '—',
    solarCapacity:     Number(profile.solar_capacity_kw ?? 0),
    status:            toUIStatus(profile.status),
    joinDate:          profile.created_at,
    todayProduction:   Number(latest?.production_kwh  ?? 0),
    todayConsumption:  Number(latest?.consumption_kwh ?? 0),
    todaySurplus:      Number(latest?.surplus_kwh     ?? 0),  // pre-computed in DB
    weeklyProduction:  parseFloat(weeklyProduction.toFixed(1)),
    weeklyConsumption: parseFloat(weeklyConsumption.toFixed(1)),
    // Guarantee 7 bars — pad with zeros if fewer records exist
    trend:             trend.length > 0
      ? [...Array(Math.max(0, 7 - trend.length)).fill(0), ...trend]
      : [0, 0, 0, 0, 0, 0, 0],
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all non-admin member profiles with their latest energy data.
 *
 * Strategy (two sequential queries, joined client-side):
 *   1. SELECT all profiles WHERE role != 'admin'
 *   2. SELECT energy_records for those user IDs, newest-first
 *   3. Group energy records by user_id (max 7 per user) and build member objects
 *
 * Energy failures are non-fatal — members load with zero energy values rather
 * than the entire list failing.
 *
 * @returns {Promise<object[]>} Array of normalised member objects
 */
export async function fetchAllMembers() {
  // ── 1. Profiles ────────────────────────────────────────────────────────────
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, name, role, household_id, solar_capacity_kw, status, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });

  if (profileErr) throw profileErr;
  if (!profiles || profiles.length === 0) return [];

  console.log('[adminMemberService] Raw DB profile statuses:', profiles.map(p => ({ id: p.id, status: p.status })));

  const userIds = profiles.map(p => p.id);

  // ── 2. Energy records ──────────────────────────────────────────────────────
  const { data: energyRecords, error: energyErr } = await supabase
    .from('energy_records')
    .select('user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at')
    .in('user_id', userIds)
    .order('recorded_at', { ascending: false });

  if (energyErr) {
    console.warn('[adminMemberService] Energy records unavailable:', energyErr.message);
  }

  // ── 3. Group energy records by user_id (max 7 per user, newest-first) ──────
  const recordsByUser = {};
  for (const record of (energyRecords ?? [])) {
    if (!recordsByUser[record.user_id]) {
      recordsByUser[record.user_id] = [];
    }
    if (recordsByUser[record.user_id].length < 7) {
      recordsByUser[record.user_id].push(record);
    }
  }

  // ── 4. Build normalised member objects ──────────────────────────────────────
  return profiles.map(profile =>
    buildMember(profile, recordsByUser[profile.id] ?? [])
  );
}

/**
 * Compute community-level aggregate statistics from an already-fetched members
 * array. Pure computation — no additional Supabase call needed.
 *
 * Mirrors the shape of COMMUNITY_STATS from mockAdminData.js so
 * AdminDashboardScreen can drop-in replace it.
 *
 * @param {object[]} members - Output of fetchAllMembers()
 * @returns {object}          - Community stats object
 */
export function computeCommunityStats(members) {
  const activeMembers    = members.filter(m => m.status === 'Active').length;
  const inactiveMembers  = members.filter(m => m.status === 'Inactive').length;
  const suspendedMembers = members.filter(m => m.status === 'Suspended').length;

  const totalProduction  = members.reduce((s, m) => s + m.todayProduction,  0);
  const totalConsumption = members.reduce((s, m) => s + m.todayConsumption, 0);
  // Only count positive surplus (deficit households don't contribute)
  const totalSurplus     = members.reduce((s, m) => s + Math.max(m.todaySurplus, 0), 0);

  return {
    totalMembers:      members.length,
    activeMembers,
    inactiveMembers,
    suspendedMembers,
    totalProduction:   parseFloat(totalProduction.toFixed(1)),
    totalConsumption:  parseFloat(totalConsumption.toFixed(1)),
    totalSurplus:      parseFloat(totalSurplus.toFixed(1)),
  };
}

/**
 * Update a member's account status in Supabase.
 *
 * Maps the UI label to the correct DB value before writing.
 * Also updates the `updated_at` timestamp.
 *
 * @param {string} userId   - profiles.id (uuid)
 * @param {string} uiStatus - 'Active' | 'Inactive' | 'Suspended'
 * @returns {Promise<object>} Updated profiles row
 * @throws {Error} On Supabase write failure
 */
export async function updateMemberStatus(userId, uiStatus) {
  const dbStatus = toDBStatus(uiStatus);

  console.log('[adminMemberService] Attempting updateMemberStatus:', { userId, uiStatus, dbStatus });

  const { data, error } = await supabase
    .from('profiles')
    .update({
      status:     dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('[adminMemberService] updateMemberStatus DB error:', error.message, 'Payload sent:', { dbStatus });
    throw error;
  }

  return data[0];
}

/**
 * Update the logged-in admin's profile details in Supabase.
 *
 * @param {string} userId   - profiles.id (uuid)
 * @param {object} updates  - { name, mobileNumber, householdId }
 * @returns {Promise<object>} Updated profiles row
 * @throws {Error} On Supabase write failure
 */
export async function updateAdminProfileDetails(userId, { name, mobileNumber, householdId }) {
  const payload = {
    name:         name.trim(),
    mobile_number: mobileNumber ? mobileNumber.trim() : null,
    household_id: householdId ? householdId.trim() : null,
    updated_at:   new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select();

  if (error) {
    console.error('[adminMemberService] updateAdminProfileDetails error:', error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Could not update admin profile. Check RLS policies for profiles table.');
  }

  return data[0];
}
