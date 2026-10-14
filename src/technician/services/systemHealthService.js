import { supabase } from '../../lib/supabase';

export async function fetchSystemHealth() {
  const { data, error } = await supabase.rpc('technician_system_health');
  if (error) throw error;
  if (!data || !Array.isArray(data.systems) || !Number.isFinite(Date.parse(data.server_time))) {
    throw new Error('Invalid system health response.');
  }
  return data;
}
