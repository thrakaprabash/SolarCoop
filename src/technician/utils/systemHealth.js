export function systemReadingFresh(system, now) {
  const time = Date.parse(system.last_reading_at);
  return Number.isFinite(time) && time <= now + 60_000 && now - time <= 60_000;
}

// Inverter alarms take precedence. Zero output alone is never a fault (e.g. night).
export function systemHealthStatus(system, now) {
  if (system.device_status === 'offline') return 'offline';
  if (system.fault_code || system.device_status === 'fault') return 'fault';
  if (system.device_status === 'degraded') return 'degraded';
  if (!Number.isFinite(Date.parse(system.last_reading_at))) return 'unknown';
  if (!systemReadingFresh(system, now)) return 'stale';
  return system.device_status === 'online' ? 'healthy' : 'unknown';
}

export function communityFeed(snapshot, now) {
  const community = snapshot?.community;
  const energy = community?.energy;
  const time = Date.parse(snapshot?.server_time);
  const current = Number.isFinite(time) && now - time <= 60_000 && time <= now + 60_000;
  const valid = value => value != null && Number.isFinite(Number(value)) ? Number(value) : null;
  const hasReadings = current && Number(energy?.fresh_households) > 0;
  const complete = hasReadings && Number(energy.fresh_households) === Number(energy.households);
  const production = hasReadings ? valid(energy?.production_kw) : null;
  const consumption = hasReadings ? valid(energy?.consumption_kw) : null;
  return {
    production, consumption, balance: complete && production != null && consumption != null ? production - consumption : null,
    pool: hasReadings ? valid(energy?.pool_today_kwh) : null,
    faults: current ? valid(community?.open_faults) : null,
    repairs: current ? valid(community?.repair_jobs) : null,
    fresh: current ? Number(energy?.fresh_households) || 0 : 0,
    total: Number(energy?.households) || 0,
  };
}
