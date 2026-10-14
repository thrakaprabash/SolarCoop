/**
 * src/admin/services/alertRules.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Detection rules for automatic (system-raised) alerts — SOL-157, item 3c.
 *
 * PURE: no Supabase, no React. Each rule takes already-fetched data plus "now"
 * and returns candidate alerts. alertScanService.js does the fetching, the
 * de-duplication against existing alerts, and the inserting — keeping the rules
 * pure is what lets them be exercised with synthetic data.
 *
 * How energy data is read (same convention the Member Monitoring cards use):
 * one row in `energy_records` is one reading; a member's NEWEST row is their
 * current reading. Daily comparisons use the final reading per Colombo day;
 * simulated comparisons exclude the partially accumulated current day. A reading is
 * only judged "current" if it's recent (THRESHOLDS.staleHours) — otherwise an
 * old seed dataset would raise alerts claiming things about "now".
 *
 * Every number that decides whether something alerts is in THRESHOLDS below.
 *
 * A candidate looks like:
 *   { type, severity, userId, message, dedupeKey, once }
 *   - severity is the UI label ('Critical' | 'High' | 'Medium' | 'Low').
 *   - userId is null for community-wide alerts.
 *   - dedupeKey identifies "the same alert" across scans.
 *   - once = true for alerts about a specific event (one transaction, one
 *     request): once raised they are never raised again, even after being
 *     resolved. State alerts (production is zero, data is stale) are raised
 *     again only after a cooldown, see shouldRaise().
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const THRESHOLDS = {
  // Data freshness
  staleHours: 48,               // a reading older than this is not "current"
  silentDays: 7,                // stale for this long = "gone silent" (Low, admin-only)
  minReadingsForSilence: 5,     // ...but only if they used to report regularly

  // Per-member energy vs their own baseline
  baselineReadings: 7,          // how many prior readings form the baseline
  minBaselineReadings: 3,       // fewer than this and there's no baseline to judge against
  minProductionBaselineKwh: 2,  // ignore members whose normal production is tiny
  zeroProductionMaxKwh: 0.2,    // at or below this counts as "almost none"
  lowProductionRatio: 0.5,      // below 50% of baseline = low production
  minConsumptionBaselineKwh: 1,
  consumptionSpikeRatio: 1.5,   // above 150% of baseline = spike

  // Community-wide
  minMembersForCommunityChecks: 2,
  communitySurplusPerMemberKwh: 1.5, // floor = this × households reporting
  deficitDays: 3,               // consecutive days of consumption > production

  // Transactions & requests
  largeTxSampleSize: 30,        // recent completed transactions used for the median
  largeTxMinSample: 5,          // fewer than this and "large" means nothing
  largeTxMultiple: 3,           // flag at ≥ 3× the median...
  largeTxMinKwh: 5,             // ...and at least this big in absolute terms
  largeTxLookbackHours: 72,     // only recent transactions are worth flagging
  requestPendingHours: 24,

  // Members & complaints
  signupPendingHours: 24,
  complaintAgingDays: 3,

  // After an alert is resolved, don't re-raise the same condition for this long
  cooldownHours: 24,
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const colomboDay = (at) => new Date(at.getTime() + 5.5 * HOUR_MS).toISOString().slice(0, 10);

// Simulator rows are cumulative daily totals. Retain the final reading of each
// Colombo day, rather than adding snapshots or treating ticks as baseline days.
export function dailyReadings(readings) {
  const days = new Map();
  for (const reading of readings) {
    const day = colomboDay(reading.at);
    if (!days.has(day) || reading.at > days.get(day).at) days.set(day, reading);
  }
  return [...days.values()].sort((a, b) => b.at - a.at);
}

const avg = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;

const median = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const round1 = (n) => Math.round(n * 10) / 10;

const hoursBetween = (later, earlier) => (later.getTime() - earlier.getTime()) / HOUR_MS;

const humanAge = (hours) =>
  hours < 48 ? `${Math.max(1, Math.round(hours))}h` : `${Math.round(hours / 24)} days`;

const who = (member) => (member.household ? `${member.name} (${member.household})` : member.name);

const nameLookup = (members) => {
  const byId = new Map(members.map((m) => [m.id, m.name]));
  return (id) => byId.get(id) ?? 'a member';
};

function candidate({ type, severity, userId = null, message, subject = null, once = false }) {
  return {
    type,
    severity,
    userId,
    message,
    dedupeKey: `${type}:${subject ?? userId ?? 'community'}`,
    once,
  };
}

// ─── #1 / #2 / #3 — a member's energy vs their own baseline ──────────────────
export function memberEnergyChecks({ members, readingsByUser }, now, t = THRESHOLDS) {
  const out = [];

  for (const m of members) {
    if (m.status !== 'Active') continue;

    const readings = readingsByUser.get(m.id);
    if (!readings || readings.length === 0) continue;

    // Do not compare a partially accumulated simulator day with full days.
    // Explicit inverter faults still arrive immediately through device_fault alerts.
    const comparable = readings[0].isSimulated
      ? dailyReadings(readings).filter(r => colomboDay(r.at) < colomboDay(now))
      : dailyReadings(readings);
    const [latest, ...history] = comparable;
    if (!latest) continue;
    if (hoursBetween(now, latest.at) > t.staleHours) continue; // not a current reading

    const prior = history.slice(0, t.baselineReadings);
    if (prior.length < t.minBaselineReadings) continue; // nothing to compare against

    const baseProduction = avg(prior.map((r) => r.production));
    const baseConsumption = avg(prior.map((r) => r.consumption));

    // Zero and low production are the same fault at two strengths, so a member
    // gets whichever applies, never both.
    if (baseProduction >= t.minProductionBaselineKwh) {
      if (latest.production <= t.zeroProductionMaxKwh) {
        out.push(candidate({
          type: 'zero_production',
          severity: 'High',
          userId: m.id,
          message: `${who(m)} reported almost no solar production in their latest reading (${round1(latest.production)} kWh, normally about ${round1(baseProduction)} kWh).`,
        }));
      } else if (latest.production < t.lowProductionRatio * baseProduction) {
        const dropPct = Math.round((1 - latest.production / baseProduction) * 100);
        out.push(candidate({
          type: 'low_production',
          severity: 'Medium',
          userId: m.id,
          message: `${who(m)}'s production is ${round1(latest.production)} kWh, ${dropPct}% below their usual ${round1(baseProduction)} kWh.`,
        }));
      }
    }

    if (
      baseConsumption >= t.minConsumptionBaselineKwh &&
      latest.consumption > t.consumptionSpikeRatio * baseConsumption
    ) {
      const risePct = Math.round((latest.consumption / baseConsumption - 1) * 100);
      out.push(candidate({
        type: 'consumption_spike',
        severity: 'Medium',
        userId: m.id,
        message: `${who(m)}'s consumption is ${round1(latest.consumption)} kWh, ${risePct}% above their usual ${round1(baseConsumption)} kWh.`,
      }));
    }
  }

  return out;
}

// ─── #4 / #5 — the community as a whole ──────────────────────────────────────
export function communityEnergyChecks({ members, readingsByUser }, now, t = THRESHOLDS) {
  const out = [];

  const active = members.filter((m) => m.status === 'Active');
  if (active.length < t.minMembersForCommunityChecks) return out;

  // #4 Surplus — judged only on households with a current reading.
  const current = active
    .map((m) => ({ m, latest: readingsByUser.get(m.id)?.[0] }))
    .filter((x) => x.latest && hoursBetween(now, x.latest.at) <= t.staleHours);

  if (current.length >= t.minMembersForCommunityChecks) {
    const total = current.reduce((sum, x) => sum + Math.max(x.latest.surplus, 0), 0);
    const floor = t.communitySurplusPerMemberKwh * current.length;
    if (total < floor) {
      out.push(candidate({
        type: 'community_surplus_low',
        severity: total <= 0 ? 'Critical' : 'High',
        message: `Community surplus is only ${round1(total)} kWh across ${current.length} households (floor ${round1(floor)} kWh) — energy sharing may be limited.`,
      }));
    }
  }

  // #5 Deficit — total consumption above total production, N days running.
  const byDate = new Map(); // 'YYYY-MM-DD' → { production, consumption, members }
  let newestReading = null;
  for (const m of active) {
    for (const r of dailyReadings(readingsByUser.get(m.id) ?? [])) {
      const day = colomboDay(r.at);
      if (r.isSimulated && day >= colomboDay(now)) continue;
      const entry = byDate.get(day) ?? { production: 0, consumption: 0, members: new Set() };
      entry.production += r.production;
      entry.consumption += r.consumption;
      entry.members.add(m.id);
      byDate.set(day, entry);
      if (!newestReading || r.at > newestReading) newestReading = r.at;
    }
  }

  const recent = [...byDate.keys()].sort().reverse().slice(0, t.deficitDays);
  if (recent.length === t.deficitDays && newestReading && hoursBetween(now, newestReading) <= t.staleHours) {
    const dayGap = (a, b) => (Date.parse(a) - Date.parse(b)) / DAY_MS; // a is newer than b
    const consecutive = recent.every((d, i) => i === 0 || dayGap(recent[i - 1], d) === 1);
    const wellCovered = recent.every((d) => byDate.get(d).members.size >= t.minMembersForCommunityChecks);
    const allInDeficit = recent.every((d) => byDate.get(d).consumption > byDate.get(d).production);

    if (consecutive && wellCovered && allInDeficit) {
      const shortfall = recent.reduce(
        (sum, d) => sum + (byDate.get(d).consumption - byDate.get(d).production), 0
      );
      out.push(candidate({
        type: 'community_deficit',
        severity: 'Medium',
        message: `Community consumption has exceeded production for ${t.deficitDays} days in a row (${round1(shortfall)} kWh short overall).`,
      }));
    }
  }

  return out;
}

// ─── #6 / #11 — stale and silent data ────────────────────────────────────────
export function dataFreshnessChecks({ members, readingsByUser }, now, t = THRESHOLDS) {
  const out = [];

  const tracked = members
    .filter((m) => m.status === 'Active')
    .map((m) => ({ m, readings: readingsByUser.get(m.id) ?? [] }))
    .filter((x) => x.readings.length > 0)
    .map((x) => ({ ...x, ageHours: hoursBetween(now, x.readings[0].at) }));

  if (tracked.length === 0) return out;

  // If nobody has reported recently, the fault is the data feed, not the
  // members — one community-wide alert instead of one per household.
  if (
    tracked.length >= t.minMembersForCommunityChecks &&
    tracked.every((x) => x.ageHours > t.staleHours)
  ) {
    const newestAge = Math.min(...tracked.map((x) => x.ageHours));
    out.push(candidate({
      type: 'stale_data',
      severity: 'Medium',
      message: `No household has reported energy data in ${humanAge(newestAge)} — the data feed may be down.`,
    }));
    return out;
  }

  for (const { m, readings, ageHours } of tracked) {
    if (ageHours >= t.silentDays * 24 && readings.length >= t.minReadingsForSilence) {
      // Silent is the stronger form of stale, so it replaces it rather than doubling up.
      out.push(candidate({
        type: 'member_silent',
        severity: 'Low',
        userId: m.id,
        message: `${who(m)} has not reported energy data for ${humanAge(ageHours)}, after reporting regularly.`,
      }));
    } else if (ageHours > t.staleHours) {
      out.push(candidate({
        type: 'stale_data',
        severity: 'Medium',
        userId: m.id,
        message: `${who(m)}'s latest energy reading is ${humanAge(ageHours)} old — their data may be unreliable.`,
      }));
    }
  }

  return out;
}

// ─── #8 — unusually large transaction ────────────────────────────────────────
export function largeTransactionChecks({ members, transactions }, now, t = THRESHOLDS) {
  const completed = transactions.filter((tx) => tx.status === 'COMPLETED'); // newest first
  const sample = completed.slice(0, t.largeTxSampleSize).map((tx) => tx.amount);
  if (sample.length < t.largeTxMinSample) return [];

  const typical = median(sample);
  if (!(typical > 0)) return [];

  const cutoff = Math.max(t.largeTxMinKwh, t.largeTxMultiple * typical);
  const nameOf = nameLookup(members);

  return completed
    .filter((tx) => hoursBetween(now, tx.at) <= t.largeTxLookbackHours && tx.amount >= cutoff)
    .map((tx) => candidate({
      type: 'large_transaction',
      severity: tx.amount >= 2 * cutoff ? 'Medium' : 'Low',
      userId: tx.senderId,
      subject: tx.id,
      once: true,
      message: `${round1(tx.amount)} kWh transfer from ${nameOf(tx.senderId)} to ${nameOf(tx.receiverId)} (ref ${tx.referenceCode}) is ${round1(tx.amount / typical)}× the recent median of ${round1(typical)} kWh.`,
    }));
}

// ─── #9 — energy request stuck pending ───────────────────────────────────────
export function pendingRequestChecks({ members, pendingRequests }, now, t = THRESHOLDS) {
  const nameOf = nameLookup(members);

  return pendingRequests
    .filter((r) => hoursBetween(now, r.at) >= t.requestPendingHours)
    .map((r) => candidate({
      type: 'request_pending',
      severity: 'Low',
      userId: r.providerId ?? r.requesterId,
      subject: r.id,
      once: true,
      message: `${nameOf(r.requesterId)}'s request for ${round1(r.amount)} kWh has been awaiting the provider's decision for ${humanAge(hoursBetween(now, r.at))}.`,
    }));
}

// ─── #10 — signup awaiting approval ──────────────────────────────────────────
export function pendingSignupChecks({ members }, now, t = THRESHOLDS) {
  return members
    .filter((m) => m.status === 'Pending' && hoursBetween(now, m.createdAt) >= t.signupPendingHours)
    .map((m) => candidate({
      type: 'signup_pending',
      severity: 'Low',
      userId: m.id,
      message: `${who(m)} has been waiting ${humanAge(hoursBetween(now, m.createdAt))} for approval.`,
    }));
}

// ─── #13 — complaint aging ───────────────────────────────────────────────────
export function complaintAgingChecks({ members, complaints }, now, t = THRESHOLDS) {
  const nameOf = nameLookup(members);

  return complaints
    .filter((c) => hoursBetween(now, c.at) >= t.complaintAgingDays * 24)
    .map((c) => candidate({
      type: 'complaint_aging',
      severity: 'Medium',
      userId: c.userId,
      subject: c.id,
      message: `A ${c.type} complaint from ${nameOf(c.userId)} has been ${String(c.status).replace('_', ' ')} for ${humanAge(hoursBetween(now, c.at))}.`,
    }));
}

// ─── Registry & runner ───────────────────────────────────────────────────────
// `needs` names the fetches a check depends on, so a failed fetch skips only
// the checks that use it instead of aborting the whole scan.
export const CHECKS = [
  { id: 'member_energy',      needs: ['members', 'readings'],     run: memberEnergyChecks },
  { id: 'community_energy',   needs: ['members', 'readings'],     run: communityEnergyChecks },
  { id: 'data_freshness',     needs: ['members', 'readings'],     run: dataFreshnessChecks },
  { id: 'large_transactions', needs: ['members', 'transactions'], run: largeTransactionChecks },
  { id: 'pending_requests',   needs: ['members', 'requests'],     run: pendingRequestChecks },
  { id: 'pending_signups',    needs: ['members'],                 run: pendingSignupChecks },
  { id: 'complaint_aging',    needs: ['members', 'complaints'],   run: complaintAgingChecks },
];

/**
 * Run every check whose inputs are available.
 *
 * @param {object} input        - { members, readingsByUser, transactions, pendingRequests, complaints }
 * @param {Map}    unavailable  - fetch name → error message, for fetches that failed
 * @param {Date}   now
 * @returns {{ candidates: object[], failedChecks: {check: string, reason: string}[] }}
 */
export function runChecks(input, unavailable, now = new Date()) {
  const candidates = [];
  const failedChecks = [];

  for (const check of CHECKS) {
    const missing = check.needs.filter((name) => unavailable.has(name));
    if (missing.length > 0) {
      failedChecks.push({
        check: check.id,
        reason: missing.map((name) => `${name}: ${unavailable.get(name)}`).join('; '),
      });
      continue;
    }

    try {
      candidates.push(...check.run(input, now));
    } catch (err) {
      failedChecks.push({ check: check.id, reason: err?.message || 'unexpected error' });
    }
  }

  return { candidates, failedChecks };
}

/**
 * Should this candidate become a new alert, given the alerts already there?
 *
 * - Never seen before → yes.
 * - `once` alerts (a specific transaction / request) → never again, even if the
 *   admin resolved the earlier one; they've already reviewed that event.
 * - State alerts → not while one is still open, and not within the cooldown of
 *   the last one — otherwise resolving "zero production" would be undone by the
 *   very next scan while the fault persists.
 *
 * @param {object} cand
 * @param {Map<string, {status: string, at: Date}[]>} existing - by dedupeKey
 */
export function shouldRaise(cand, existing, now, t = THRESHOLDS) {
  const previous = existing.get(cand.dedupeKey) ?? [];
  if (previous.length === 0) return true;
  if (cand.once) return false;

  return !previous.some(
    (p) => p.status === 'active' || (!p.autoResolved && hoursBetween(now, p.resolvedAt ?? p.at) < t.cooldownHours)
  );
}

const RECOVERY_CHECKS = {
  zero_production: 'member_energy', low_production: 'member_energy', consumption_spike: 'member_energy',
  community_surplus_low: 'community_energy', community_deficit: 'community_energy',
  stale_data: 'data_freshness', member_silent: 'data_freshness',
  request_pending: 'pending_requests', signup_pending: 'pending_signups', complaint_aging: 'complaint_aging',
};

export function recoveredAlertIds(existing, candidates, failedChecks) {
  const present = new Set(candidates.map(c => c.dedupeKey));
  const failed = new Set(failedChecks.map(c => c.check));
  const ids = [];
  for (const [key, rows] of existing) {
    const check = RECOVERY_CHECKS[key.split(':')[0]];
    // One-off transaction alerts must be reviewed, not aged out by a scan.
    if (!check || failed.has(check) || present.has(key)) continue;
    for (const row of rows) if (row.status === 'active') ids.push(row.id);
  }
  return ids;
}
