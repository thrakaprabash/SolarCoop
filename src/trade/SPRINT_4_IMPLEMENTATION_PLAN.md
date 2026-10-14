# SolarCoop Sprint 4 — Pawan's phase-by-phase implementation plan

Prepared: 3 October 2026  
Sprint dates in the supplied guide: 30 September–4 October 2026  
Scope: finish and stabilize P2P, connect Smart Energy Insights and Sustainability Impact to real data, and prepare the demonstration.

Current decision, 4 October: the user adopted latest reading per Asia/Colombo day as accumulated daily totals. The normalization adapter and read-only daily screens are now connected. Earlier unresolved-contract gates describe planning history; see SPRINT_4_DATA_CONTRACT.md and SPRINT_4_HANDOFF.md for current verification and remaining acceptance.

## 1. Stories and implementation order

| Phase | Story | Points | Outcome |
| --- | --- | ---: | --- |
| 0 | Preparation for all stories | — | Confirm working baseline, data meaning, calculation rules, and access. |
| 1 | SOL-179 | 3 | Verify and finish P2P feature integration. |
| 2 | SOL-180 | 3 | Reproduce and fix confirmed P2P defects; complete regression checks. |
| 3 | SOL-182 | 3 | Generate predictable insights from the member's actual energy records. |
| 4 | SOL-183 | 2 | Display real solar generation, shared energy, and defensible sustainability calculations. |
| 5 | SOL-181 | 2 | Prepare accounts, consistent data, evidence, and a rehearsed demo. |
| **Total** | | **13** | |

The guide is a requirements reference. Its instructions to prepare data, change statuses, or complete integration are not permission to alter teammates' code, shared database rules, Jira issues, or live records.

## 2. Working boundaries

- Implement inside `src/trade`. Read existing authentication, Supabase, and energy modules as needed.
- Ask before changing `App.js`, `src/context`, `src/services`, admin/alerts/dashboard code, shared database schema or policies, or any other teammate-owned files.
- Sprint 3's approved migration remains the existing foundation. That approval does not authorize new Sprint 4 migrations.
- Preserve the previous sprint's UI and Jira history. Use the new Sprint 4 story keys for new commits.
- Preserve local changes; do not reset, overwrite, or copy whole checkouts over each other.
- Keep `.env` local and ignored. Do not put credentials in notes, demo evidence, fixtures, or commits.
- Read the exact Expo SDK 57 documentation before implementation. Add no dependency unless the work actually requires it.
- Use the existing UI, Supabase client, and authentication context. Keep analytics rule-based and read-only.
- Obtain approval for any new live demo submissions, approvals, rejections, seeding, cleanup, or account changes. Use a test database or rollback tests where practical.
- Push each verified, story-keyed commit when implementing. Jira status changes and merges follow the team's process; this plan does not perform them.

## 3. What the repository already contains

### P2P foundation to reuse

The completed Sprint 3 work is in the managed worktree:

`C:/Users/Asus/.codex/worktrees/sol-178-my-requests/SolarCoop`

Branch: `codex/SOL-175-178-final-verification`. Last recorded commit: `5bf04d5`.

It contains persistent request lists, guarded approval/rejection, participant transaction details, paginated history reads, filters, refresh states, and account-scoped state. Approval means immediate completion: PENDING -> COMPLETED with one transaction. Rejection means PENDING -> REJECTED with no transfer. The guide's word “approved” describes the action; it does not require restoring a separate APPROVED stage.

Sprint 3 evidence: 20 automated tests, 10 live rollback database assertions, and a successful production web export. See `IMPLEMENTATION_HANDOFF.md` in that worktree. Those are historical results, not proof that the current shared environment still behaves identically.

Outstanding Sprint 3 checks to carry into Sprint 4:

- A physical-device smoke test.
- A real network outage and successful UI retry.
- Simultaneous approval attempts in separate sessions.
- Applying the migration from scratch on a matching isolated test database, if available.

At planning time, the main checkout `D:/GitHub/SolarCoop` had earlier uncommitted trade drafts and an `App.js` change. On 3 October those were preserved in a recoverable stash, `develop` was updated to `3e09a0e`, and the remaining Sprint 3 work was integrated with the translated app on `codex/SOL-179-sprint4-baseline` (merge `04da9c7`). See `SPRINT_4_DATA_CONTRACT.md` for the current Phase 0 evidence and pending decisions.

### New functionality to connect

| Existing file | Current behavior | Planned work |
| --- | --- | --- |
| `context/TradeContext.js` | Supplies sample `ENERGY` and `IMPACT` values. | Supply authenticated, dated, real analytics with independent loading/error states. |
| `screens/SmartEnergyInsightsScreen.js` | Calls `buildInsights` using sample values. | Display calculated insights and real data coverage/freshness. |
| `screens/SustainabilityImpactScreen.js` | Sums sample generation/sharing arrays. | Display period-specific generation and completed outgoing trades. |
| `utils/insights.js` | Assumes populated arrays and positive averages; includes surplus and trend rules. | Guard missing/zero data and generate only supported messages. |
| `data/energy.js` | Contains seeded energy and impact figures plus static SDG labels. | Remove samples from the live path; retain static SDG 7/11 metadata. |
| `services/transactionService.js` | Reads participant transactions on the completed Sprint 3 branch. | Reuse ledger semantics for impact rather than dashboard history strings. |
| `context/NavigationContext.js`, `navigation/TradeShell.js` | Register Insights and Impact alongside P2P screens. | Verify entry paths and useful return navigation. |

The shared dashboard service reads `energy_metrics` and `energy_history`; its context includes mock fallbacks. Do not treat those fallbacks as measured data for this sprint. Existing admin code describes `energy_records` as readings, but does not establish whether multiple readings in one day are interval energy or cumulative totals.

## Phase 0 — Establish the baseline and calculation contract

**Purpose:** Resolve the facts that determine whether the analytics are correct.

### Steps

1. Review the main checkout, the committed Sprint 3 worktree, and the team's intended integration branch. Identify overlapping changes and preserve them. Continue from a baseline containing the verified Sprint 3 commits; if the team wants a different base, integrate the required commits deliberately.
2. Re-run the existing trade tests. Check the live migration/RPCs and participant access using read-only checks before running approved rollback verification. Record the current baseline and test environment.
3. Inspect a small, user-scoped sample of `energy_records`: `id`, `user_id`, `production_kwh`, `consumption_kwh`, `surplus_kwh`, `recorded_at`. Check units, number of readings per day, duplicates, resets, missing values, and recency.
4. Confirm the meaning of production/consumption with the energy-data owner. A timestamped row does not prove it is a complete day's total. Confirm whether records are daily totals, cumulative daily snapshots, cumulative lifetime counters, or interval values.
5. Confirm timezone, seven-day window, current consumption definition, insight thresholds, Impact reporting period, and self-sufficiency inputs using the decision table below.
6. Verify that the signed-in user can read their own records. Scope every analytics query to their ID even where the existing energy-record SELECT policy is broad. Do not silently change that shared policy.
7. Confirm how members reach Insights/Impact from the app's Energy tab and the module. Fix internal links inside `src/trade`; request permission if the app-level route needs a change.
8. Record decisions in `src/trade/SPRINT_4_DATA_CONTRACT.md`, including any unresolved owner dependency.

### Decisions to settle before calculations

| Question | Recommended approach | Why it matters |
| --- | --- | --- |
| What is one valid day? | Produce one normalized daily aggregate from the confirmed record type. Use the latest snapshot per day only for daily cumulative readings; sum only confirmed interval records. Lifetime counters require validated differences and reset handling. | Summing cumulative readings inflates energy totals. |
| Which timezone? | Use the team's reporting timezone; propose `Asia/Colombo`. Convert calendar boundaries to UTC for queries. | Midnight records otherwise move into the wrong day. |
| Seven-day average window? | Previous seven completed calendar days, excluding today. Divide by the number of valid observed days; display coverage such as “5 of 7 days”. | Seven latest rows are not necessarily seven days; missing days are not zeros. |
| What is “current”? | Today's valid aggregate, clearly marked “so far” if incomplete. Do not relabel an old reading as today. | A partial day compared with full days is provisional. A matched-time comparison is only possible if supported by the data. |
| Insight thresholds? | Keep the existing >10% / <-10% bands as a proposal, confirm them with the user, and state the rule in the contract. | The guide gives examples, not an exact threshold specification. |
| Impact period? | Propose month-to-date in the same timezone for generation, consumption, and completed sent trades. Display the period and data coverage. | Comparing unrelated time windows makes the indicators misleading. |
| True solar self-sufficiency? | Identify measured energy supplied to the home by its own solar, including agreed storage/export treatment. If unavailable, show unavailable until the team accepts an explicitly labelled estimate. | Production and consumption totals alone do not measure actual own-solar consumption. |

**Self-sufficiency fallback proposal:** if the team accepts a limited estimate, calculate per valid day `min(production, consumption)`, sum over days where both values are valid, divide by consumption for those same days, and label it “Estimated solar coverage”. This is an upper-bound energy-balance proxy, not measured self-sufficiency. Do not silently use it under an accurate-looking self-sufficiency label. Even subtracting P2P exports cannot account for unrecorded grid exports, timing, or battery flows.

**Deliverables:** baseline record, agreed data contract, list of permission-dependent changes.

**Gate:** The P2P baseline is identified. Daily aggregation and the current/average comparison are agreed before Phase 3 calculations. Self-sufficiency inputs or the explicitly labelled fallback are agreed before that part of Phase 4. Work on independent reads and UI states can continue while a calculation decision is pending.

## Phase 1 — SOL-179: Finish P2P integration

**Purpose:** Verify the existing implementation as one feature and close integration gaps without rebuilding it.

### Tasks mapped to the guide

- **T1 — Request -> provider:** submit an approved test request; verify one persisted pending row in My Requests and Incoming Requests, with correct parties, amount and ID. Refresh/reopen both views.
- **T2 — Approval -> transaction:** approve one authorized test request through the existing guarded RPC. Verify COMPLETED request, one matching completed ledger row, and one surplus deduction. Test rejection separately and verify no ledger/surplus change.
- **T3 — History -> details:** open sent/received transactions by UUID; verify amount, reference, status, timestamp and participants. Return to the correct source screen.
- **T4 — Authentication:** check account switch/sign-out, delayed responses, private request/transaction access, and caller identity for actions. Reuse the third-member rollback checks.
- **T5 — Navigation:** exercise list -> request -> My Requests, incoming -> approval -> details, history -> details, and Energy -> Insights <-> Impact. Verify missing IDs, expired request context, cancel, and back paths.

### Likely files

`context/TradeContext.js`, `context/NavigationContext.js`, `navigation/TradeShell.js`, P2P screens, and existing request/transaction services. App-level route changes remain permission-dependent.

**Deliverable:** `src/trade/SPRINT_4_INTEGRATION_CHECKS.md` with observed results and any reproducible defects.

**Gate:** All five task outcomes are verified, or specific confirmed defects are recorded for Phase 2. No second transaction is created by repeated approval. No unrelated request is changed.

**Commit:** `SOL-179 Complete P2P integration and verify navigation` after the relevant checks pass. If no implementation change is needed, commit the verification evidence instead of inventing changes.

## Phase 2 — SOL-180: Fix confirmed defects and regressions

**Purpose:** Stabilize actual failures found in Phase 1 and the remaining Sprint 3 checks.

### Steps

1. **T1:** record each confirmed defect with reproduction steps, expected/actual result, affected account/screen, severity, and related story. Avoid duplicate reports. Significant separate issues can become linked Jira Bugs when the user authorizes tracking them.
2. **T2:** fix confirmed request-loading, approve/reject, refresh, state-transition, or wrong-request problems inside the component.
3. **T3:** fix confirmed transaction mapping, persistence, duplicate-action, or stale-surplus behavior. If the root cause is shared SQL, prepare the proposed migration for review and ask before editing/applying it.
4. **T4:** fix confirmed history/filter/detail/loading/empty/error problems. Check large result sets for API truncation and stale data after account changes.
5. Exercise simultaneous approval from two sessions on controlled test requests. Verify exactly one linked ledger row; also verify competing requests cannot exceed the provider's balance. Prefer an isolated matching database; do not run competing approvals on a teammate's pending request.
6. Exercise real UI network failure: disconnect on the test device, refresh, check that loading ends and an error/retry appears, reconnect, and retry successfully. Ensure errors are not shown as genuine zero/empty data.
7. **T5:** rerun the complete P2P flow plus the affected regression tests and an Expo 57 production web build. Test on the intended demo device.

**Deliverable:** `src/trade/SPRINT_4_BUG_LOG.md` with verified fixes and remaining issues. Add focused tests for the failures actually fixed.

**Gate:** Confirmed blocking defects no longer reproduce; previously working P2P behavior still passes. Mark unperformed concurrent/device/network checks as pending rather than passed.

**Commits:** `SOL-180 Fix <confirmed problem>` and, when useful, a separate `SOL-180 Verify P2P regressions` evidence commit.

## Phase 3 — SOL-182: Connect Smart Energy Insights

**Purpose:** Replace sample insights with calculations based on this member's dated energy data.

### Data layer and state

1. **T1:** add a read-only `src/trade/services/energyAnalyticsService.js` using the existing Supabase client. Query only the signed-in user's necessary fields and date range; use stable timestamp/ID ordering and pagination if the range can exceed the server row limit.
2. Add pure normalization helpers, for example `utils/energyAnalytics.js`, implementing the Phase 0 record contract. Validate finite nonnegative kWh, timestamp validity and duplicates. Preserve missing values as unavailable; real zero remains valid. Do not silently coerce null/blank values to zero.
3. Expose independent analytics states through a small component-local hook/context, or extend TradeContext if simpler. Include user ID, loading, refreshing, error, data coverage, and latest measured time. Hide old-user data immediately and ignore outdated responses. Reload on account change and screen entry; support retry and refresh.
4. Read the member's name from the existing authenticated profile if available; use a neutral greeting otherwise. Remove the fixed sample name.

### Calculations and rules

5. **T2:** normalize the previous seven completed days and calculate `sum(valid daily consumption) / valid day count`. Example: 10, 12 and 8 kWh across three valid days gives 10 kWh/day, with coverage 3/7. No valid days gives unavailable, not NaN.
6. **T3:** compare today's valid aggregate with the baseline only when both exist. For average >0, calculate `((current - average) / average) * 100`. With a zero baseline, use an absolute message instead of a percentage. Display the provisional nature of a partial-day comparison.
7. **T4:** refactor `utils/insights.js` to generate deterministic higher/lower/in-line messages from the agreed thresholds. No random messages or external AI service.
8. Retain the existing surplus card only when supported: use the already-agreed backend tradeable balance for “available to share”, not raw production minus consumption. Show a sharing CTA only for eligible providers and make its action meaningful within the existing workflow. Coordinate if an intended destination belongs to another module.
9. Retain the existing trend card only with three consecutive valid calendar days in chronological order. Gaps, invalid values, or insufficient history must not generate a trend.
10. **T5:** connect `SmartEnergyInsightsScreen.js` to the real data. Keep InsightCard styling. Show loading, retry, no records, insufficient history, stale/no-current-day data, coverage, and refresh states. Ensure display rounding does not drive the rule calculations.

### Focused tests

- Full seven days; one/fewer valid days; no history; gaps and multiple readings on a day.
- Midnight/timezone boundaries, older/out-of-order records, and deterministic ID ties.
- Zero baseline; zero current consumption; missing/negative/nonfinite data.
- Above, below and exactly on each threshold boundary.
- Three-day trend with and without gaps.
- Delayed reads during account switch; failed read and successful retry.
- Surplus message after a completed trade, without overstating shareable energy.

**Gate:** The displayed average and comparison reconcile with the agreed real records; unsupported cards do not appear. Missing data never produces NaN, Infinity, fake measurements, or a false “normal usage” claim.

**Commit:** `SOL-182 Connect rule-based insights to member energy data`.

## Phase 4 — SOL-183: Connect Sustainability Impact

**Purpose:** Replace sample totals with consistent, user-specific indicators for the agreed period.

### Steps

1. **T1:** reuse normalized energy records to calculate solar generation for the agreed Impact period. Show its dates and coverage. Do not sum repeated cumulative snapshots.
2. **T2:** query completed outgoing transactions for that user and the same period. Sum `energy_amount` only where `sender_id = current user` and `status = COMPLETED`. Exclude received, pending/request-only, rejected and reversed transfers. Reuse transaction service conventions; add a bounded impact read if the existing full-ledger fetch would be unnecessarily large.
3. Avoid double-counting dashboard `energy_history` and the P2P `transactions` ledger. They are different data sources. P2P shared energy comes from the latter.
4. **T3:** implement the agreed self-sufficiency calculation using measured own-solar supply and matching consumption where available: `own solar supplied / total consumption * 100`. Missing inputs or a zero denominator produce an unavailable result. Validate impossible values; do not hide bad source data by blindly clamping it.
5. If Phase 0 approves the estimate instead, implement and label it exactly as agreed. If no defensible source or accepted estimate exists, show “Self-sufficiency unavailable” with a brief reason; record the unresolved acceptance dependency.
6. **T4:** connect `SustainabilityImpactScreen.js` and, if necessary, `ImpactStatCard.js` to numbers or meaningful unavailable placeholders. Render progress only for a valid percentage. Retain SDG 7 and SDG 11 as informational references. Do not add unsupported CO2, financial, or environmental conversions.
7. **T5:** distinguish no completed trades (valid shared total 0) from unavailable/failed ledger data. Distinguish observed zero generation from no energy records. If one source fails, retain the independent valid metrics and provide retry for the failed source.
8. Refresh on entry, account change, and explicit refresh; verify a newly completed trade is reflected when Impact is revisited. Remove sample `IMPACT` values from the production path while retaining static SDG metadata.

### Reconciliation examples and tests

- Completed sent 0.5 + 1.0 kWh, received 2.0 kWh, and reversed sent 0.5 kWh -> shared total **1.5 kWh**.
- Same period and participant filter at month/timezone boundaries.
- Missing energy and/or ledger records; one failed source; real zero values.
- Self-sufficiency: measured own-solar supply 6 kWh / matching consumption 10 kWh -> **60%**; zero consumption -> unavailable.
- If using the approved estimate, test daily alignment so surplus on one day does not incorrectly cover consumption on another day.
- Account switch and stale responses; refresh after approval or reversal.

**Gate:** Every shown value reconciles with the appropriate real source, user, period, and formula. Required self-sufficiency functionality remains explicitly pending if its data contract is unresolved; a placeholder alone does not satisfy the calculation acceptance criterion.

**Commit:** `SOL-183 Integrate sustainability indicators with real energy and trades`.

## Phase 5 — SOL-181: Demo preparation and final handoff

**Purpose:** Demonstrate the finished feature without ad hoc database edits during the presentation.

### Steps

1. **T1:** confirm an active provider with sufficient real/test surplus, a requester, and an unrelated member. Reuse existing test accounts if still available. The user enters credentials and completes any registration/verification. Document account roles, never passwords.
2. **T2:** prepare approved demo data for request, pending, approve and reject paths, history and details. Also ensure dated energy data supports Insights and Impact. If seeding is necessary, use a matching test environment or ask before any shared-data change. Keep a manifest of fixture ownership and expected values.
3. **T3:** rehearse login -> submit -> requester list -> provider incoming -> approve -> saved transaction -> both histories/details. Use a separate authorized request for rejection. Show Insights average/comparison and Impact generation/shared energy/self-sufficiency using the agreed calculations.
4. **T4:** capture screenshots and a short recording showing both roles, approval/rejection, history/details, Insights, Impact, and selected empty/error states. Keep credentials, private account details and unrelated member data out of evidence. Verify recordings play and screenshots are readable.
5. **T5:** rehearse on the intended physical device and network. Check scrolling, pull-to-refresh, keyboard, modal double taps, cancel/back behavior, restart, and recovery after lost connectivity.
6. Re-run focused tests and production export after final fixes. Check the commit diff contains only approved scope and no environment files or generated build output.
7. Prepare `src/trade/SPRINT_4_DEMO_RUNBOOK.md` and `src/trade/SPRINT_4_HANDOFF.md`: setup, account roles, exact walkthrough, expected values, evidence locations, completed/pending checks, commit IDs, and known limitations.

**Gate:** The complete demo works without manual SQL intervention during the flow. Accounts/data and backup evidence are ready, and the final rehearsal passes. Record limitations honestly; resolve blockers before declaring the sprint complete.

**Commit:** `SOL-181 Prepare P2P and analytics demonstration evidence`.

## 4. Execution priorities for the remaining sprint time

The guide ends this sprint on 4 October. Treat this as an order of checkpoints, not a promise that unresolved data dependencies can be completed within a day.

1. **First:** settle Phase 0, preserve the Sprint 3 baseline, and surface energy-data questions immediately.
2. **Then:** verify integration and fix only reproduced blocking defects. Continue independent analytics reads while waiting for an owner decision.
3. **Next:** implement and verify Insights, then Impact using the shared normalization logic.
4. **Finally:** allow time for real-device/network tests, a full rehearsal, and readable backup evidence.

If time is constrained, reduce optional surplus/trend cards before reducing calculation correctness, data isolation, or required demo evidence. Report an unresolved self-sufficiency source as a dependency rather than inventing a metric.

## 5. Final acceptance and handoff checklist

- [ ] Working baseline and overlap with main checkout reconciled without losing changes.
- [ ] Daily energy semantics, timezone, windows, thresholds and self-sufficiency contract documented.
- [ ] SOL-179 T1–T5 pass across both participant accounts.
- [ ] SOL-180 T1–T5 complete; confirmed blocking defects fixed and regressions checked.
- [ ] Simultaneous approval, real network recovery and intended-device checks completed or explicitly reported pending.
- [ ] SOL-182 T1–T5 use actual member records; seven-day average and insights verified.
- [ ] SOL-183 T1–T5 use aligned energy/ledger data; self-sufficiency requirement met with the agreed method.
- [ ] Loading, empty, missing, stale, zero and error/retry cases handled for both analytics screens.
- [ ] No seeded energy/impact values are shown as live measurements.
- [ ] SOL-181 T1–T5 complete; accounts, data, screenshots, recording and rehearsal ready.
- [ ] Focused tests and production build pass; shared or teammate changes have explicit approval.
- [ ] Story-keyed commits pushed; final review, Jira updates, and merge handled through the team's process.

## 6. Starting point

Start with **Phase 0**. The first implementation session should confirm the baseline and inspect dated member energy records, then settle the daily aggregation and self-sufficiency questions. This document is the plan only; it does not change application code, database data, Jira status, or branches.
