import { supabase } from '../../lib/supabase';

/** Colombo calendar boundaries; Sri Lanka uses UTC+05:30 without DST. */
export function reportingPeriod(now = new Date()) {
  const local = new Date(now.getTime() + 330 * 60 * 1000);
  const day = local.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  return { day, month, start: new Date(`${month}-01T00:00:00+05:30`).toISOString(), end: now.toISOString() };
}

/** A dated reading is evidence of freshness, not a normalized daily total. */
export async function fetchLatestEnergyReading(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('energy_records')
    .select('id, user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false }).order('id', { ascending: false })
    .limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.user_id !== userId || !data.recorded_at || !Number.isFinite(Date.parse(data.recorded_at))) {
    throw new Error('The energy reading could not be verified.');
  }
  return data;
}

/** Only completed sent trades count; paginate before returning any total. */
export async function fetchSharedEnergy(userId, period) {
  if (!userId) return null;
  let total = 0;
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('transactions')
      .select('id, sender_id, status, energy_amount, created_at')
      .eq('sender_id', userId).eq('status', 'COMPLETED')
      .gte('created_at', period.start).lte('created_at', period.end)
      .order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const row of data || []) {
      const amount = typeof row.energy_amount === 'number' ||
        (typeof row.energy_amount === 'string' && row.energy_amount.trim() !== '')
        ? Number(row.energy_amount) : NaN;
      const timestamp = row.created_at ? Date.parse(row.created_at) : NaN;
      if (row.sender_id !== userId || row.status !== 'COMPLETED' ||
        !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(timestamp) ||
        timestamp < Date.parse(period.start) || timestamp > Date.parse(period.end)) {
        throw new Error('The shared-energy total could not be verified.');
      }
      total += amount;
      if (!Number.isFinite(total)) throw new Error('The shared-energy total could not be verified.');
    }
    if (!data || data.length < pageSize) return total;
  }
}
