import { supabase } from '../lib/supabase';
import { EMPTY_DETAILS, registrationDetailsPayload } from '../utils/registrationDetails';

export async function fetchMemberDetails(userId, role) {
  const household = role === 'owner' || role === 'consumer';
  const tables = household ? ['household_details', ...(role === 'owner' ? ['solar_systems'] : [])] : ['technician_details'];
  const results = await Promise.all(tables.map(table => supabase.from(table).select('*').eq('user_id', userId).maybeSingle()));
  const failure = results.find(result => result.error);
  if (failure) throw failure.error;
  const primary = results[0].data;
  const system = role === 'owner' ? results[1]?.data : null;
  return {
    complete: Boolean(primary && (role !== 'owner' || system)),
    values: {
      ...EMPTY_DETAILS,
      address: primary?.address || '', district: primary?.district || primary?.service_district || '', city: primary?.city || '',
      monthlyConsumption: primary?.monthly_consumption_kwh == null ? '' : String(primary.monthly_consumption_kwh),
      solarCapacity: system?.panel_capacity_kwp == null ? '' : String(system.panel_capacity_kwp),
      inverterBrand: system?.inverter_brand || '', inverterModel: system?.inverter_model || '',
      inverterCapacity: system?.inverter_capacity_kw == null ? '' : String(system.inverter_capacity_kw),
      panelCount: system?.panel_count == null ? '' : String(system.panel_count),
      specialization: primary?.specialization || '', qualification: primary?.qualification || '',
      experienceYears: primary?.experience_years == null ? '' : String(primary.experience_years),
    },
  };
}

export async function saveMemberDetails(role, values) {
  const { error } = await supabase.rpc('save_my_registration_details', { p_details: registrationDetailsPayload(role, values) });
  if (error) throw error;
}
