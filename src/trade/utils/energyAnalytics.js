const DAY_MS = 86400000;

function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function previousDay(day, offset) {
  return new Date(Date.parse(`${day}T00:00:00Z`) - offset * DAY_MS).toISOString().slice(0, 10);
}
function amount(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function finiteSum(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number.isFinite(total) ? total : null;
}

/**
 * Accepts normalized daily totals, NEVER raw energy_records snapshots.
 * Each day: { date: YYYY-MM-DD in reporting timezone, production, consumption }.
 * Caller must first establish the source's daily normalization contract.
 * Duplicate dates are unavailable, so accidental double-counting cannot pass.
 */
export function calculateDailyAnalytics(days, { today, contractConfirmed = false } = {}) {
  const empty = { available: false, reason: 'unknownDailyContract', average: null,
    baselineDays: 0, baselineWindow: 7, current: null, comparison: null, trend: null,
    generation: null, generationDays: 0, estimatedSolarCoverage: null, matchedDays: 0 };
  if (!contractConfirmed) return empty;
  if (!validDay(today) || !Array.isArray(days)) return { ...empty, reason: 'invalidInput' };
  const byDay = new Map();
  for (const row of days) {
    if (!row || !validDay(row.date)) continue;
    if (byDay.has(row.date)) byDay.set(row.date, null);
    else byDay.set(row.date, { production: amount(row.production), consumption: amount(row.consumption) });
  }
  const baselineValues = Array.from({ length: 7 }, (_, i) => byDay.get(previousDay(today, i + 1))?.consumption)
    .filter((value) => value != null);
  const baselineTotal = finiteSum(baselineValues);
  const average = baselineTotal == null ? null : baselineTotal / baselineValues.length;
  const current = byDay.get(today)?.consumption ?? null;
  let comparison = null;
  if (average != null && current != null) {
    if (average === 0) comparison = { kind: current === 0 ? 'inLine' : 'aboveZero', percent: null,
      absolute: current, provisional: true };
    else {
      const percent = ((current - average) / average) * 100;
      const tolerance = Number.EPSILON * 100;
      if (Number.isFinite(percent)) comparison = { kind: percent > 10 + tolerance ? 'higher' : percent < -10 - tolerance ? 'lower' : 'inLine',
        percent, absolute: current - average, provisional: true };
    }
  }
  // Three completed consecutive days; today's partial total is excluded.
  const trail = [3, 2, 1].map((offset) => byDay.get(previousDay(today, offset))?.consumption);
  let trend = null;
  if (trail.every((value) => value != null)) {
    if (trail[0] > trail[1] && trail[1] > trail[2]) trend = { kind: 'decreasing', values: trail };
    if (trail[0] < trail[1] && trail[1] < trail[2]) trend = { kind: 'increasing', values: trail };
  }
  const monthStart = `${today.slice(0, 7)}-01`;
  const month = [...byDay].filter(([day, row]) => row && day >= monthStart && day <= today).map(([, row]) => row);
  const generationValues = month.filter((row) => row.production != null).map((row) => row.production);
  const matched = month.filter((row) => row.production != null && row.consumption != null);
  const covered = finiteSum(matched.map((row) => Math.min(row.production, row.consumption)));
  const consumption = finiteSum(matched.map((row) => row.consumption));
  const coverage = covered != null && consumption > 0 ? covered / consumption * 100 : null;
  return { ...empty, available: true, reason: null, average, baselineDays: baselineValues.length, current,
    comparison, trend, generation: finiteSum(generationValues), generationDays: generationValues.length,
    estimatedSolarCoverage: coverage != null && Number.isFinite(coverage) ? coverage : null,
    matchedDays: matched.length };
}
