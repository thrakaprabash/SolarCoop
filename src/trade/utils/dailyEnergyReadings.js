/**
 * Project convention adopted by the user on 4 October 2026:
 * energy_records stores accumulated daily kWh; latest snapshot per Colombo day wins.
 * This is the single adapter to replace if the source contract changes.
 * Invalid latest amounts stay invalid; never substitute an older, plausible value.
 */
export function normalizeDailyReadings(readings) {
  if (!Array.isArray(readings)) throw new Error('Energy history is invalid.');
  const byDay = new Map();
  for (const row of readings) {
    const timestamp = row?.recorded_at ? Date.parse(row.recorded_at) : NaN;
    const id = String(row?.id ?? '');
    if (!Number.isFinite(timestamp) || !/^\d+$/.test(id)) {
      throw new Error('Energy history is invalid.');
    }
    const date = new Date(timestamp + 330 * 60000).toISOString().slice(0, 10);
    const previous = byDay.get(date);
    // IDs are bigint: compare exactly, without converting them to floating point.
    if (!previous || timestamp > previous.timestamp ||
      (timestamp === previous.timestamp && BigInt(id) > BigInt(previous.id))) {
      byDay.set(date, { row, timestamp, id });
    }
  }
  return [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, { row }]) => ({
    date, production: row.production_kwh, consumption: row.consumption_kwh,
  }));
}
