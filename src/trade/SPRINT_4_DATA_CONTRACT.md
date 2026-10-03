# Sprint 4 Phase 0 — data contract and baseline

Updated: 4 October 2026. Status: **daily snapshot convention adopted by the user; read-only analytics connected**.

## Current daily contract (supersedes earlier unresolved notes)

The user explicitly chose to define each energy_records reading as accumulated production/consumption for its Asia/Colombo calendar day, using the latest reading per day. This is a campus-project convention, not an independently verified sensor specification. Earlier unknown-semantics notes below record the history before this decision.

- `utils/dailyEnergyReadings.js` is the replaceable normalization adapter. It selects greatest recorded_at, then greatest bigint id for equal timestamps; it never sums snapshots or falls back to an older amount when the latest amount is invalid.
- Bounded, authenticated-user history reads cover both month-to-date and the previous seven completed days, paginate before returning input, and exclude future readings. A failed page makes calculations unavailable rather than partial.
- Today's value is labelled so far. Previous days use their last recorded snapshots; no finality flag exists, so absence of a later snapshot is not proof of sensor completeness.
- Missing/invalid consumption days are excluded from averages and their coverage is shown. Generation and estimated coverage use their own valid/matched day coverage.
- Live screens are connected under this convention. Current requester has no readings; the provider's known August reading still cannot supply October values. Numeric fixture calculations pass; positive-data live UI verification is pending.
- Changing the source interpretation later requires replacing the adapter and updating tests/documentation. No teammate producer, shared table, sensor reading, policy or migration was changed.

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
- Live Phase 0 results received: energy schema, participant read policies, guarded pending-request insert policy, one-transaction-per-request index, saved COMPLETED 0.5 kWh trade, authenticated own-record access, and RPC existence/grants confirmed. Historical Sprint 3 checks are not represented as fresh results.
- Production web export passed: 2,403 modules bundled into ignored `.expo/sprint4-baseline-export`.
- The integration labels exist in all three current locale dictionaries (English, Sinhala, Tamil); no shared locale file was edited.
- Dependency reproducibility limitation: the pulled localization packages were missing locally. The npm lockfile install returned registry 403 for `use-sync-external-store@1.7.0`; an offline pnpm attempt also found an incomplete package store. Local dependencies were restored from the existing installed Sprint 3 snapshot with matching declared version ranges. Its dependency links point into that preserved worktree. The production build used this snapshot, not a successful fresh npm lockfile install. Before removing that worktree, install independent dependencies successfully. No manifest or npm lockfile was changed; the temporary alternative lock is stored under ignored `.expo`.

## Confirmed application/database conventions

| Area | Convention |
| --- | --- |
| Member identity | Existing AuthContext exposes user and profile. Queries use user.id. |
| Energy records | Live schema confirmed: id, user_id, production_kwh, consumption_kwh, surplus_kwh, recorded_at. |
| Record meaning | Existing admin code calls these readings. It does not establish daily/interval/counter semantics. **Owner confirmation pending.** |
| P2P ledger | Use transactions; do not combine it with dashboard energy_history. |
| Completed sharing | Sum COMPLETED outgoing rows for sender_id = current user; exclude received and REVERSED. |
| Approval lifecycle | Approval immediately completes the request and creates one transaction. Rejection creates no transfer. |
| Available to share | Existing guarded backend balance; do not substitute raw production minus consumption. |
| Analytics | Pure rule-based calculations, read-only energy/ledger access, no mock fallback presented as measurements. |

The supplied live schema confirms that energy_records has the six known fields, and energy_metrics has instant/daily production and consumption plus dashboard metrics. Neither includes measured own-solar supply, household solar self-consumption, or aligned grid/export/storage flows.

## Live inspection evidence

- Pending inserts require authenticated requester identity, different requester/provider, and PENDING status. The supplied policy list has participant/admin SELECT and admin-only transaction UPDATE, with no direct member request UPDATE or transaction INSERT policy.
- `transactions_one_per_request_idx` is unique on non-null request_id.
- Saved trade `e3bed65b-5b06-41ce-870e-330558931bec` is COMPLETED, 0.5 kWh, reference `TXN-E3BED65B5B0641CE870E330558931BEC`.
- The identity-setting output selected provider `f46fac2b-1ef7-40ce-87f5-2bbad6bc1c90`, but the subsequent access output reported effective_role=postgres and provider_selected=false. Its zero records and empty sample results are inconclusive; they do not establish that the provider has no readings. This is consistent with statements being executed in separate runs.
- Item 4 contained SQL text, not the RPC existence/grant result rows. Use `SPRINT_4_PHASE_0_RECHECK.sql` as one complete batch to retrieve authenticated access, samples, and grants in one row. Expected access context: authenticated, provider_selected=true, admin_access=false, saved_trade_provider_matches=true.
- Follow-up `phase0_recheck` confirmed exactly that access context. The provider can read its own energy record as an authenticated non-admin and matches the saved trade's sender.
- All three public trade RPCs exist, permit authenticated EXECUTE, and deny anon EXECUTE.
- The scoped sample contains one record: id=1, recorded_at=2026-08-26 10:34:28.38247+00 (Colombo date 2026-08-26), production=6.1 kWh, consumption=1.9 kWh, surplus=4.2 kWh. No negative values were observed. Earliest/latest both match that timestamp.
- This sample is older than the current October reporting windows. It provides no current-day, previous-seven-day, or October month-to-date energy coverage. Production/consumption aggregation semantics cannot be established from a single reading. Analytics must show missing/stale energy states for this account rather than reuse the August reading as current data. Historical ledger access remains independently valid.

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

### Component-local defaults and unresolved record meaning

The user instructed us to continue without depending on a teammate's interpretation or changing teammates' work. Use the proposed reporting rules below as component-local defaults. Record semantics stay unknown: do not sum readings or select snapshots as daily totals without evidence. Implement real reads, freshness, empty/error states, and transaction-based Impact independently. Daily consumption comparisons, generation totals, and Estimated solar coverage remain unavailable until a defensible normalization contract exists. This limitation is not completion of the calculation acceptance criteria.

- Reporting timezone: Asia/Colombo.
- Baseline: previous seven completed calendar days, excluding today; divide by valid observed day count once daily normalization is supported.
- Current consumption: today's aggregate labelled “so far”; incomplete-day comparison is provisional, and remains unavailable with unknown normalization.
- Thresholds: higher >10%, lower <-10%, otherwise in-line, preserving current bands. With baseline zero, use an absolute message instead of a percentage.
- Impact reporting period: month-to-date, with aligned production/consumption and completed outgoing transaction dates.
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

App.js renders the same TradeModule type for both tabs without distinct keys, while NavigationProvider initializes its screen only once. Phase 1 adds a key based on initialScreen to the internal NavigationProvider, so changing entry tabs remounts navigation and discards the prior route/params. App.js is unchanged. Browser verification remains pending.

## Phase 0 completion checklist

- [x] Integration merge committed and production build checked.
- [x] Existing automated trade suite passes after integration.
- [x] Repository sources and field definitions inspected.
- [x] Live schema/RPC/policy/index checks received and reviewed.
- [x] Authenticated provider can read its own energy records; dated samples inspected.
- [ ] Energy-data owner confirms record semantics and daily normalization.
- [x] Timezone, seven-day/current/Impact periods and rule bands recorded as component-local defaults under the user's instruction to continue.
- [x] User accepted explicitly labelled Estimated solar coverage.
- [ ] Data contract updated with observed live results and final decisions.

The user approved continuing with the recorded energy-data limitation. Proceed to integration and independent analytics work. The unresolved daily aggregation acceptance criteria remain open; live access checks are complete.
