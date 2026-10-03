# Sprint 4 Phase 0 — data contract and baseline

Updated: 3 October 2026. Status: **in progress**, pending live inspection and energy-record semantics.

## Integration baseline

- Started from updated `develop` at `3e09a0e` on `codex/SOL-179-sprint4-baseline`.
- Integrated the remaining Sprint 3 history commit `3bc9744` and verification commit `5bf04d5` through their existing branch ancestry. Integration merge: `04da9c7`.
- Kept the pulled English/Sinhala/Tamil translation calls and label mappings while restoring real history reads, pagination, refresh/retry, reversed status, and completed-only monthly totals.
- Name fallbacks remain in translated UI components. Missing profile names from services are null; tests were adapted to this existing contract.
- Removed seeded transaction exports and the remaining sample-detail lookup from live history/details paths.
- No changes to App.js, shared authentication/energy services, locale files, database migration files, or live data.
- The main checkout's earlier drafts remain recoverable in stash `f09756f5dba967709419ae7e6c045bab3e673c37`. The previous Sprint 3 worktree remains intact.

## Verification so far

- All 20 integrated trade tests pass, including pagination, reversed totals, failed reads, retries, and delayed account responses.
- All 59 trade JavaScript files parsed successfully after conflict resolution.
- Live backend verification and sample energy records are pending the read-only `SPRINT_4_PHASE_0_VERIFY.sql` results. Historical Sprint 3 checks are not represented as fresh results.
- Production web export passed: 2,403 modules bundled into ignored `.expo/sprint4-baseline-export`.
- The integration labels exist in all three current locale dictionaries (English, Sinhala, Tamil); no shared locale file was edited.
- Dependency reproducibility limitation: the pulled localization packages were missing locally. The npm lockfile install returned registry 403 for `use-sync-external-store@1.7.0`; an offline pnpm attempt also found an incomplete package store. Local dependencies were restored from the existing installed Sprint 3 snapshot with matching declared version ranges. Its dependency links point into that preserved worktree. The production build used this snapshot, not a successful fresh npm lockfile install. Before removing that worktree, install independent dependencies successfully. No manifest or npm lockfile was changed; the temporary alternative lock is stored under ignored `.expo`.

## Confirmed application/database conventions

| Area | Convention |
| --- | --- |
| Member identity | Existing AuthContext exposes user and profile. Queries use user.id. |
| Energy records | Known fields: id, user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at. Current live schema must be checked. |
| Record meaning | Existing admin code calls these readings. It does not establish daily/interval/counter semantics. **Owner confirmation pending.** |
| P2P ledger | Use transactions; do not combine it with dashboard energy_history. |
| Completed sharing | Sum COMPLETED outgoing rows for sender_id = current user; exclude received and REVERSED. |
| Approval lifecycle | Approval immediately completes the request and creates one transaction. Rejection creates no transfer. |
| Available to share | Existing guarded backend balance; do not substitute raw production minus consumption. |
| Analytics | Pure rule-based calculations, read-only energy/ledger access, no mock fallback presented as measurements. |

The current known energy fields do not include measured own-solar supply, household solar self-consumption, or aligned grid/export/storage flows. Live schema inspection will check whether additional usable inputs have been added.

## User decisions

### Confirmed

The user chose **the labelled estimate** for the percentage card on 3 October 2026.

Display name: **Estimated solar coverage**. Do not present it as measured solar self-sufficiency.

For each valid matched day, estimated solar-covered energy is `min(daily production, daily consumption)`. For the reporting period:

```text
Estimated solar coverage % =
  sum(min(production, consumption) for matched valid days)
  / sum(consumption for those same days) * 100
```

This is a capped energy-balance estimate; it does not measure generation/consumption timing or account for grid exports and battery flows. A zero denominator, no matched days, or invalid inputs gives an unavailable value, never NaN/Infinity. Missing days are excluded with visible coverage, not filled with zeros. Record normalization must be settled before this formula can run.

### Awaiting confirmation

- Reporting timezone: proposed Asia/Colombo.
- Baseline: proposed previous seven completed calendar days, excluding today; divide by valid observed day count.
- Current consumption: proposed today's aggregate labelled “so far”; incomplete-day comparison is provisional.
- Thresholds: proposed higher >10%, lower <-10%, otherwise in-line, preserving current bands. With baseline zero, use an absolute message instead of a percentage.
- Impact reporting period: proposed month-to-date, with aligned production/consumption and completed outgoing transaction dates.
- Energy record type: daily totals, accumulating daily snapshots, interval values, or lifetime counters. Do not infer this merely from timestamps or one sample row.

## Normalization gate

- Daily totals: confirm at most one authoritative daily value; define a deterministic replacement/duplicate rule.
- Accumulating daily snapshots: select the latest valid snapshot per day only after owner confirmation; check resets/finality.
- Interval energy: sum only the intervals assigned to that day, with overlap/duplicate rules.
- Lifetime counters: require preceding readings and validated deltas/reset handling; do not sum counter values.
- Numeric zero is valid; null, blank, nonfinite, or negative values are not silently coerced into observations.
- Convert agreed calendar boundaries to UTC for queries. Order by recorded_at and id.
- Identify stale records and missing current-day data. Do not label old seed readings as “today”.

## Navigation inspection

App.js currently sends P2P Trade to initialScreen=list and Energy to initialScreen=insights. TradeShell already registers Insights and Impact and the screens link to one another.

Potential integration issue to reproduce in Phase 1: App.js renders the same TradeModule type for both tabs without distinct keys, while NavigationProvider initializes its screen only once. Switching directly between those tabs may retain the previous internal screen. If reproduced, prefer a component-local fix in TradeModule/NavigationProvider; any App.js edit requires separate user approval.

## Phase 0 completion checklist

- [x] Integration merge committed and production build checked.
- [x] Existing automated trade suite passes after integration.
- [x] Repository sources and field definitions inspected.
- [ ] Live schema/RPC/policy/index checks received and reviewed.
- [ ] Authenticated provider can read its own energy records; dated samples inspected.
- [ ] Energy-data owner confirms record semantics and daily normalization.
- [ ] Timezone, seven-day/current/Impact periods and rule bands confirmed.
- [x] User accepted explicitly labelled Estimated solar coverage.
- [ ] Data contract updated with observed live results and final decisions.

Phase 0 is not complete while the unresolved calculation inputs and live checks remain pending. Independent integration/read-layer work can proceed; energy aggregation must wait for the record contract.
