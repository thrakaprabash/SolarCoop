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
    const timestamp = typeof row?.recorded_at === 'string' ? Date.parse(row.recorded_at) : NaN;
    const id = String(row?.id ?? '');
    if (!Number.isFinite(timestamp) || !/^\d+$/.test(id)) {
      throw new Error('Energy history is invalid.');
    }
    const date = new Date(timestamp + 330 * 60000).toISOString().slice(0, 10);
    const fraction = row.recorded_at.match(/\.(\d+)(?:Z|[+-]\d{2}(?::?\d{2})?)$/i)?.[1] || '';
    const micros = BigInt(timestamp) * 1000n + BigInt(fraction.padEnd(6, '0').slice(3, 6));
    const previous = byDay.get(date);
    // IDs are bigint: compare exactly, without converting them to floating point.
    if (!previous || micros > previous.micros ||
      (micros === previous.micros && BigInt(id) > BigInt(previous.id))) {
      byDay.set(date, { row, micros, id });
    }
  }
  return [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, { row }]) => ({
    date, production: row.production_kwh, consumption: row.consumption_kwh,
  }));
}
