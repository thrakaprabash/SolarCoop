/**
 * scripts/test-alert-rules.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Smoke test for the automatic-alert detection rules (src/admin/services/
 * alertRules.js). No database, no app, no network: alertRules.js is pure, so
 * every rule is fed synthetic data and its output checked against the
 * thresholds documented in alert_system_plan.md §5.
 *
 *   node --no-warnings scripts/test-alert-rules.mjs
 *
 * Exit code 0 = every check passed, 1 = at least one failed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  CHECKS,
  memberEnergyChecks,
  communityEnergyChecks,
  dataFreshnessChecks,
  largeTransactionChecks,
  pendingRequestChecks,
  pendingSignupChecks,
  complaintAgingChecks,
  runChecks,
  shouldRaise,
} from '../src/admin/services/alertRules.js';

// ─── Tiny harness ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? `\n          ${detail}` : ''}`);
  }
}

const section = (title) => console.log(`\n${title}`);
const types = (list) => list.map((c) => c.type).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ─── Synthetic data builders ──────────────────────────────────────────────────
const NOW = new Date('2026-10-03T12:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000);
const daysAgo = (d) => hoursAgo(d * 24);

const reading = (production, consumption, at) => ({
  production, consumption, surplus: production - consumption, at,
});

/** Newest-first readings: one "latest", then `prior` baseline readings a day apart. */
function series({ latest, base = { p: 5, c: 4 }, latestAgeHours = 2, prior = 7 }) {
  const out = [reading(latest.p, latest.c, hoursAgo(latestAgeHours))];
  for (let i = 1; i <= prior; i += 1) {
    out.push(reading(base.p, base.c, hoursAgo(latestAgeHours + 24 * i)));
  }
  return out;
}

const member = (id, over = {}) => ({
  id, name: `Member ${id}`, household: `HH-${id}`, status: 'Active', createdAt: daysAgo(30), ...over,
});

// ─── 1. Per-member energy vs their own baseline ──────────────────────────────
section('Member energy (zero / low production, consumption spike)');
{
  const members = [member('zero'), member('low'), member('spike'), member('ok'),
    member('edge'), member('nearzero')];
  const readingsByUser = new Map([
    ['zero',     series({ latest: { p: 0.1, c: 4 } })],
    ['low',      series({ latest: { p: 2,   c: 4 } })],     // 40% of a 5 kWh baseline
    ['spike',    series({ latest: { p: 5,   c: 9 } })],     // 225% of a 4 kWh baseline
    ['ok',       series({ latest: { p: 4.8, c: 4.2 } })],
    ['edge',     series({ latest: { p: 2.5, c: 6 } })],     // exactly 50% / exactly 150%
    ['nearzero', series({ latest: { p: 0.21, c: 4 } })],    // just above the "zero" line
  ]);
  const out = memberEnergyChecks({ members, readingsByUser }, NOW);
  const by = (id) => out.filter((c) => c.userId === id).map((c) => c.type);

  check('almost no production → zero_production only (not low as well)',
    same(by('zero'), ['zero_production']), JSON.stringify(by('zero')));
  check('zero_production is High', out.find((c) => c.type === 'zero_production')?.severity === 'High');
  check('40% of baseline → low_production (Medium)',
    same(by('low'), ['low_production']) && out.find((c) => c.type === 'low_production')?.severity === 'Medium',
    JSON.stringify(by('low')));
  check('225% of baseline consumption → consumption_spike',
    same(by('spike'), ['consumption_spike']), JSON.stringify(by('spike')));
  check('normal readings → no alert', by('ok').length === 0, JSON.stringify(by('ok')));
  check('exactly 50% production / exactly 150% consumption → no alert (strict comparisons)',
    by('edge').length === 0, JSON.stringify(by('edge')));
  check('0.21 kWh is just over the zero line → low_production, not zero_production',
    same(by('nearzero'), ['low_production']), JSON.stringify(by('nearzero')));

  const again = memberEnergyChecks({ members, readingsByUser }, NOW);
  check('dedupeKey is stable between scans (needed for de-duplication)',
    same(out.map((c) => c.dedupeKey).sort(), again.map((c) => c.dedupeKey).sort()) &&
    out.find((c) => c.type === 'zero_production')?.dedupeKey === 'zero_production:zero');
}

section('Member energy — when a reading must NOT be judged');
{
  const members = [member('old'), member('thin'), member('pending', { status: 'Pending' })];
  const readingsByUser = new Map([
    ['old',     series({ latest: { p: 0, c: 4 }, latestAgeHours: 60 })],          // newest reading > 48 h old
    ['thin',    series({ latest: { p: 0, c: 4 }, prior: 2 })],                    // only 2 prior readings
    ['pending', series({ latest: { p: 0, c: 4 } })],                              // not an Active member
  ]);
  const out = memberEnergyChecks({ members, readingsByUser }, NOW);
  check('stale reading is not judged as "current"', !out.some((c) => c.userId === 'old'));
  check('fewer than 3 prior readings → no baseline → no alert', !out.some((c) => c.userId === 'thin'));
  check('non-Active member is skipped', !out.some((c) => c.userId === 'pending'));
}

// ─── 2. Community-wide ───────────────────────────────────────────────────────
section('Community surplus / deficit');
{
  const members = [member('a'), member('b'), member('c')];
  const mk = (surplusEach) => new Map(members.map((m) =>
    [m.id, [reading(3 + surplusEach, 3, hoursAgo(2))]]));

  const low = communityEnergyChecks({ members, readingsByUser: mk(0.1) }, NOW);
  check('total surplus below 1.5 kWh × households → community_surplus_low (High)',
    same(types(low), ['community_surplus_low']) && low[0].severity === 'High', JSON.stringify(types(low)));
  check('community alert targets nobody (userId null) with a "community" key',
    low[0]?.userId === null && low[0]?.dedupeKey === 'community_surplus_low:community');

  const none = communityEnergyChecks({ members, readingsByUser: mk(-1) }, NOW);
  check('no positive surplus at all → Critical', none[0]?.severity === 'Critical', JSON.stringify(none));

  const healthy = communityEnergyChecks({ members, readingsByUser: mk(3) }, NOW);
  check('healthy surplus → no alert', healthy.length === 0, JSON.stringify(types(healthy)));

  const solo = communityEnergyChecks({ members: [member('a')], readingsByUser: mk(0) }, NOW);
  check('fewer than 2 active members → community checks stay silent', solo.length === 0);

  // Deficit: 2 members × 3 consecutive days, consumption > production each day.
  const deficitDays = (consumptionOnDay) => {
    const m = new Map();
    for (const id of ['a', 'b']) {
      m.set(id, [0, 1, 2].map((d) => reading(2, consumptionOnDay(d), hoursAgo(2 + 24 * d))));
    }
    return m;
  };
  const dMembers = [member('a'), member('b')];

  const deficit = communityEnergyChecks({ members: dMembers, readingsByUser: deficitDays(() => 4) }, NOW);
  check('consumption > production 3 days running → community_deficit (Medium)',
    deficit.some((c) => c.type === 'community_deficit' && c.severity === 'Medium'), JSON.stringify(types(deficit)));

  const broken = communityEnergyChecks({ members: dMembers, readingsByUser: deficitDays((d) => (d === 1 ? 1 : 4)) }, NOW);
  check('one surplus day in the window breaks the streak',
    !broken.some((c) => c.type === 'community_deficit'));

  const gap = new Map(['a', 'b'].map((id) =>
    [id, [0, 1, 3].map((d) => reading(2, 4, hoursAgo(2 + 24 * d)))]));   // day 2 missing
  check('a missing day means the days are not consecutive → no deficit alert',
    !communityEnergyChecks({ members: dMembers, readingsByUser: gap }, NOW).some((c) => c.type === 'community_deficit'));
}

// ─── 3. Freshness ────────────────────────────────────────────────────────────
section('Stale / silent data');
{
  const members = [member('fresh'), member('stale'), member('silent'), member('fewsilent')];
  const readingsByUser = new Map([
    ['fresh',     series({ latest: { p: 5, c: 4 } })],
    ['stale',     series({ latest: { p: 5, c: 4 }, latestAgeHours: 72 })],        // 3 days old
    ['silent',    series({ latest: { p: 5, c: 4 }, latestAgeHours: 8 * 24 })],    // 8 days old, 8 readings
    ['fewsilent', series({ latest: { p: 5, c: 4 }, latestAgeHours: 8 * 24, prior: 2 })], // 8 days old, 3 readings
  ]);
  const out = dataFreshnessChecks({ members, readingsByUser }, NOW);
  const by = (id) => out.filter((c) => c.userId === id).map((c) => c.type);

  check('3-day-old reading → stale_data for that member only', same(by('stale'), ['stale_data']), JSON.stringify(by('stale')));
  check('8 days old after regular reporting → member_silent (Low), and NOT also stale_data',
    same(by('silent'), ['member_silent']) && out.find((c) => c.type === 'member_silent')?.severity === 'Low',
    JSON.stringify(by('silent')));
  check('8 days old but under 5 readings → stale_data, not silent', same(by('fewsilent'), ['stale_data']), JSON.stringify(by('fewsilent')));
  check('fresh member → nothing', by('fresh').length === 0);

  const allStale = new Map(['x', 'y', 'z'].map((id) => [id, series({ latest: { p: 5, c: 4 }, latestAgeHours: 100 })]));
  const feed = dataFreshnessChecks({ members: [member('x'), member('y'), member('z')], readingsByUser: allStale }, NOW);
  check('nobody reporting → ONE community-wide stale_data alert, not one per member',
    feed.length === 1 && feed[0].type === 'stale_data' && feed[0].userId === null, JSON.stringify(feed));
}

// ─── 4. Transactions / requests / signups / complaints ───────────────────────
section('Large transactions');
{
  const members = [member('s'), member('r')];
  const tx = (id, amount, ageH, status = 'COMPLETED') => ({
    id, senderId: 's', receiverId: 'r', amount, referenceCode: `TXN-${id}`, status, at: hoursAgo(ageH),
  });
  // Newest first, as alertScanService supplies them.
  const normal = Array.from({ length: 28 }, (_, i) => tx(`n${i}`, 2, 80 + i));
  const list = [tx('big', 12, 5), tx('mid', 7, 6), ...normal, tx('ancient', 15, 100), tx('rev', 20, 4, 'REVERSED')];
  const out = largeTransactionChecks({ members, transactions: list }, NOW);
  const byId = (id) => out.find((c) => c.dedupeKey === `large_transaction:${id}`);

  check('12 kWh vs a 2 kWh median (cutoff 6) → flagged', !!byId('big'));
  check('≥ 2× the cutoff → Medium; between 1× and 2× → Low',
    byId('big')?.severity === 'Medium' && byId('mid')?.severity === 'Low', `${byId('big')?.severity}/${byId('mid')?.severity}`);
  check('alerts about one transaction are once-only', out.every((c) => c.once === true));
  check('older than 72 h → ignored', !byId('ancient'));
  check('REVERSED transactions are ignored', !byId('rev'));
  check('fewer than 5 completed transactions → no baseline, no alerts',
    largeTransactionChecks({ members, transactions: [tx('a', 50, 1), tx('b', 2, 2)] }, NOW).length === 0);
}

section('Pending requests, signups, complaints');
{
  const members = [member('u'), member('newbie', { status: 'Pending', createdAt: hoursAgo(30) }),
    member('fresh', { status: 'Pending', createdAt: hoursAgo(5) }), member('act')];

  const reqs = pendingRequestChecks({
    members,
    pendingRequests: [
      { id: '1', requesterId: 'u', amount: 3, at: hoursAgo(30) },
      { id: '2', requesterId: 'u', amount: 3, at: hoursAgo(10) },
      { id: '3', requesterId: 'u', amount: 3, at: hoursAgo(24) },
    ],
  }, NOW);
  check('request pending ≥ 24 h → request_pending (24 h exactly counts, 10 h does not)',
    same(reqs.map((c) => c.dedupeKey).sort(), ['request_pending:1', 'request_pending:3']), JSON.stringify(reqs.map((c) => c.dedupeKey)));
  check('request alerts are once-only', reqs.every((c) => c.once));

  const signups = pendingSignupChecks({ members }, NOW);
  check('Pending for 30 h → signup_pending; Pending for 5 h and Active members → nothing',
    same(signups.map((c) => c.userId), ['newbie']), JSON.stringify(signups.map((c) => c.userId)));

  const complaints = complaintAgingChecks({
    members,
    complaints: [
      { id: 'c1', userId: 'u', type: 'Billing Dispute', status: 'under_review', at: daysAgo(4) },
      { id: 'c2', userId: 'u', type: 'Other', status: 'open', at: daysAgo(1) },
    ],
  }, NOW);
  check('complaint open ≥ 3 days → complaint_aging (Medium); 1 day old → nothing',
    same(complaints.map((c) => c.dedupeKey), ['complaint_aging:c1']) && complaints[0].severity === 'Medium',
    JSON.stringify(complaints.map((c) => c.dedupeKey)));
  check('status reads naturally in the message ("under review", not "under_review")',
    complaints[0]?.message.includes('under review'), complaints[0]?.message);
}

// ─── 5. De-duplication ───────────────────────────────────────────────────────
section('De-duplication (shouldRaise)');
{
  const state = { dedupeKey: 'zero_production:u1', once: false };
  const once = { dedupeKey: 'large_transaction:t1', once: true };
  const ex = (...rows) => new Map([[state.dedupeKey, rows], [once.dedupeKey, rows]]);

  check('never raised before → raise', shouldRaise(state, new Map(), NOW));
  check('an open alert already exists → do not raise again',
    !shouldRaise(state, ex({ status: 'active', at: daysAgo(5) }), NOW));
  check('resolved 2 h ago (inside the 24 h cooldown) → do not re-raise',
    !shouldRaise(state, ex({ status: 'resolved', at: hoursAgo(2) }), NOW));
  check('resolved 30 h ago (cooldown over) and condition persists → raise again',
    shouldRaise(state, ex({ status: 'resolved', at: hoursAgo(30) }), NOW));
  check('once-only alert is never re-raised, even long after being resolved',
    !shouldRaise(once, ex({ status: 'resolved', at: daysAgo(30) }), NOW));
  check('dismissed counts like resolved (cooldown applies)',
    !shouldRaise(state, ex({ status: 'dismissed', at: hoursAgo(3) }), NOW));
}

// ─── 6. Resilience ───────────────────────────────────────────────────────────
section('Scan resilience (runChecks)');
{
  const input = {
    members: [member('newbie', { status: 'Pending', createdAt: hoursAgo(30) })],
    readingsByUser: new Map(), transactions: [], pendingRequests: [], complaints: [],
  };
  const res = runChecks(input, new Map([['readings', 'permission denied for table energy_records']]), NOW);
  const failedIds = res.failedChecks.map((f) => f.check).sort();
  check('a failed readings fetch disables exactly the three energy checks',
    same(failedIds, ['community_energy', 'data_freshness', 'member_energy']), JSON.stringify(failedIds));
  check('…and the failure reason is reported, not swallowed',
    res.failedChecks.every((f) => f.reason.includes('permission denied')));
  check('…while unrelated checks still run (signup_pending still raised)',
    res.candidates.some((c) => c.type === 'signup_pending'));

  const crashed = runChecks({ ...input, members: null }, new Map(), NOW);
  check('a rule that throws is reported in failedChecks instead of aborting the scan',
    crashed.failedChecks.some((f) => f.check === 'member_energy'), JSON.stringify(crashed.failedChecks.map((f) => f.check)));
  check(`registry lists all ${CHECKS.length} checks`, CHECKS.length === 7);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
