# SOL-181 — SolarCoop demo runbook

Prepared: 3 October 2026. Status: walkthrough prepared; full rehearsal and evidence capture pending.

## Setup

Working directory: `D:/GitHub/SolarCoop`.
Branch: `codex/SOL-179-sprint4-baseline`.
Latest implementation commit at preparation: `9efd7b2` (SOL-182/SOL-183).

If the existing preview is running, reuse `http://localhost:8082/`. Otherwise:

```powershell
node node_modules/expo/bin/cli start --web --port 8082
```

Use the existing ignored .env. The user signs into each test account; never store passwords in this runbook or screenshots. Installed dependencies currently depend on the preserved Sprint 3 worktree; see the Phase 0 contract before removing it.

## Accounts and saved evidence

| Role | Existing account/evidence | Expected behavior |
| --- | --- | --- |
| Requester | SolarCoop Test Requester | Saved 0.5 kWh completed request and separate rejected request to Vihanga Perera; received transaction in September history. |
| Provider | Vihanga Perera | Sender of the saved completed trade; authenticated read check found one August energy reading. User must sign in for provider UI rehearsal. |
| Unrelated member | Existing third-member database access check | Historical test confirmed no access to the saved transaction. Current UI check remains pending. |

Saved reference: `TXN-E3BED65B5B0641CE870E330558931BEC`.
Saved transaction UUID: `e3bed65b-5b06-41ce-870e-330558931bec`.

## Read-only walkthrough to perform now

1. Sign into the requester account and open P2P Trade -> My Requests. Confirm completed and rejected 0.5 kWh requests.
2. Open the completed request's transaction. Confirm COMPLETED, 0.5 kWh, Vihanga Perera -> requester, 30 September, and the saved reference. Return to My Requests.
3. Open Transaction History. The saved received trade belongs to September. October totals must exclude it.
4. Open that history row, confirm the same details, then use Back to History. Sync and verify the row remains.
5. From a nested trade route, choose Energy. Insights must open rather than retain the previous route.
6. Confirm the greeting uses the current profile or a neutral Insights title. No fixed Menuka/sample consumption/trend figures should appear.
7. Confirm the record state: loading initially, then latest reading date or no records. A failed read must show retry, not no records. Daily consumption calculations stay unavailable with the current unresolved contract.
8. Open Impact. Confirm a Colombo month-to-date period. On 3 October, the period starts 1 October; a September transaction must not count.
9. Shared energy should be 0.0 kWh if this requester has no completed outgoing October trades. Received trades do not count. Confirm against current data rather than assuming no new activity occurred.
10. Solar generation and Estimated solar coverage must show unavailable, with no sample totals or percentage bar.
11. Use Sync and pull-to-refresh. Loading must finish; verified values should return. Switch back to P2P: Available Community Energy must open.
12. User signs into the provider account. Verify account changes hide requester data. Check latest reading date is 26 August if no newer record has been added, and is not described as today's energy.
13. Verify Incoming Requests/history/details with existing records. A guarded available balance is separate from daily production; do not use it as a daily generation total.

## Live action rehearsal — authorization required

Earlier Sprint 3 authorization covered the saved approved/rejected test requests. It does not authorize additional live records for this rehearsal. Before submitting a new request, name the requester, provider, amount, and approve/reject action for the user's approval. Do not act on unrelated pending requests.

For authorized disposable test requests only: submit -> requester Pending -> provider Incoming -> approve -> COMPLETED -> exactly one transaction in both histories/details. Use a separate authorized request for rejection; verify REJECTED and no transfer. Record IDs and reference codes to reconcile results. Simultaneous approvals require a controlled test setup and separate permission for its records.

## Recovery and device rehearsal

- On the intended phone: check scrolling, keyboard, cancel/back, details, and pull-to-refresh.
- User disconnects the test device, refreshes, and verifies loading ends with an error/retry. Reconnect and retry. Record actual results; simulated tests are not this check.
- Reopen/restart the app and verify saved requests/trades persist.
- Do not manually edit database records during the presentation to make numbers match.

## Evidence to capture after verification

- Requester completed/rejected requests; provider incoming outcomes.
- Matching transaction/history/details reference.
- Correct Energy/P2P tab routing.
- Real empty/stale Insights state and Impact period/shared total.
- Retry/recovery and phone demonstration.

Keep credentials, private account details and unrelated members out of captures. The analytics screenshot bundle is under `evidence/sprint4/README.md`; it contains the supplied empty/stale/failure/recovery states and direct browser language checks. P2P recording, physical-device evidence, and full rehearsal remain pending.

## Demo limits to explain

P2P uses persisted requests and guarded transactions. Analytics uses real account-scoped reads and completed outgoing ledger totals. Daily generation, averages/trends, and solar coverage are still unavailable because the source readings do not have verified daily aggregation semantics. The full calculation acceptance criteria and full demo rehearsal remain open.
