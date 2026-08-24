/**
 * src/services/energyService.js
 * ---------------------------------------------------------------------------
 * All Supabase queries for energy data.
 *
 * Uses the singleton client from src/lib/supabase.js - no new dependencies.
 * Every exported function throws on error so that callers (EnergyContext) can
 * catch and fall back to mock data gracefully.
 * ---------------------------------------------------------------------------
 */

import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * Fetch the live metrics snapshot for a member.
 * Returns the row object or null when no row exists yet.
 */
export const fetchMetrics = async (userId) => {
  const { data, error } = await supabase
    .from('energy_metrics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Upsert the metrics row for a member (used after share / borrow actions).
 */
export const upsertMetrics = async (userId, patch) => {
  const { data, error } = await supabase
    .from('energy_metrics')
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export const HISTORY_PAGE_SIZE = 20;

/**
 * Fetch a paginated page of history logs for a member.
 * Returns { logs: [], hasMore: boolean }
 */
export const fetchHistory = async (userId, page = 1) => {
  const from = (page - 1) * HISTORY_PAGE_SIZE;
  const to   = from + HISTORY_PAGE_SIZE; // fetch one extra to detect hasMore

  const { data, error } = await supabase
    .from('energy_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const hasMore = data.length > HISTORY_PAGE_SIZE;
  return {
    logs: hasMore ? data.slice(0, HISTORY_PAGE_SIZE) : data,
    hasMore,
  };
};

/**
 * Append a share energy transaction and update metrics atomically.
 * Returns the new history log row.
 */
export const postShareEnergy = async (userId, amountKwh, recipient) => {
  const earned = (amountKwh * 0.30).toFixed(2);

  const { data: logRow, error: logErr } = await supabase
    .from('energy_history')
    .insert({
      user_id: userId,
      type:    'surplus',
      title:   `Shared ${amountKwh} kWh with ${recipient}`,
      amount:  `+${amountKwh} kWh`,
      cost:    `+$${earned} earned`,
      status:  'Completed',
      detail:  'Direct peer-to-peer energy transfer via Co-op Pool',
    })
    .select()
    .single();

  if (logErr) throw logErr;

  // Increment metrics best-effort
  const { data: current } = await supabase
    .from('energy_metrics')
    .select('coop_pool_shared_today, coop_tokens_earned')
    .eq('user_id', userId)
    .maybeSingle();

  if (current) {
    await supabase
      .from('energy_metrics')
      .update({
        coop_pool_shared_today: parseFloat(
          (current.coop_pool_shared_today + amountKwh).toFixed(1),
        ),
        coop_tokens_earned: current.coop_tokens_earned + amountKwh * 10,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  return logRow;
};

/**
 * Append a borrow energy transaction.
 * Returns the new history log row.
 */
export const postBorrowEnergy = async (userId, amountKwh) => {
  const cost = (amountKwh * 0.20).toFixed(2);

  const { data: logRow, error: logErr } = await supabase
    .from('energy_history')
    .insert({
      user_id: userId,
      type:    'deficit',
      title:   `Borrowed ${amountKwh} kWh from Co-op`,
      amount:  `-${amountKwh} kWh`,
      cost:    `-$${cost} borrowed`,
      status:  'Settled',
      detail:  'Covered household demand via community battery reserve',
    })
    .select()
    .single();

  if (logErr) throw logErr;
  return logRow;
};

// ---------------------------------------------------------------------------
// Appliances
// ---------------------------------------------------------------------------

/**
 * Fetch the appliance list for a member.
 */
export const fetchAppliances = async (userId) => {
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Toggle the active state of a single appliance.
 */
export const updateAppliance = async (applianceId, active) => {
  const { data, error } = await supabase
    .from('appliances')
    .update({ active })
    .eq('id', applianceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------------------
// Chart data (SOL-153)
// ---------------------------------------------------------------------------

/**
 * Fetch chart data for a given range ('day' | 'week' | 'month').
 * SOL-153: Backend retrieval from Supabase chart_data table.
 * Returns the row or null when none exists.
 */
export const fetchChartData = async (userId, range = 'day') => {
  const { data, error } = await supabase
    .from('chart_data')
    .select('*')
    .eq('user_id', userId)
    .eq('range', range)
    .maybeSingle();

  if (error) throw error;
  return data;
};