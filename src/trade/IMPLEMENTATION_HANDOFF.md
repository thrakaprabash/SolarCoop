# Sprint 3 trade implementation handoff

Updated: 30 September 2026. Stories: SOL-175, SOL-176, SOL-177, SOL-178.

## Implemented behavior

- My Requests and Incoming Requests read the signed-in member's database rows, with loading, retry, empty states, and pull-to-refresh.
- Approval immediately completes the request and saves one linked completed transaction through the guarded database operation.
- Rejection saves REJECTED without transferring energy.
- Completed request rows and history cards reopen the persistent transaction details for either participant.
- History shows All/Sent/Received filters, month groups, real participant names, and completed monthly totals. Reversed trades remain visible and are excluded from those totals.
- Account changes hide previous member data immediately; stale request responses cannot replace a newer refresh.
- The live request and transaction paths no longer contain seeded sample records.

## Agreed database contract

Migration: `supabase/migrations/0006_trade_approval.sql`, already applied and verified in the shared Supabase project.

Tradeable energy is the latest `energy_records` surplus minus completed sent transactions after that reading, floored at zero. A newer sensor reading becomes the new baseline. The trade implementation does not modify sensor readings or the dashboard's `energy_metrics` values.

Lifecycle: PENDING -> COMPLETED or REJECTED. Existing APPROVED requests can still be displayed. REVERSED is a transaction status controlled by the existing admin workflow.

Approval locks the request and provider profile, checks ownership, active provider status and current surplus, then inserts the ledger row and completes the request in one database transaction. A unique partial index allows at most one transaction per linked request. Direct member updates of requests and inserts into transactions are blocked; authenticated members use the guarded RPCs.

## Verification evidence

### Live browser walkthrough on Expo 57

Used Vihanga Perera as provider and SolarCoop Test Requester as requester. The user authorized the earlier test submission, approval, and rejection.

| Check | Observed result |
| --- | --- |
| Valid 0.5 kWh request | Persisted and visible to both participants. |
| Approval | Request COMPLETED; saved transaction 0.5 kWh; surplus 4.2 -> 3.7 kWh. |
| Separate 0.5 kWh rejection | Request REJECTED; surplus stayed 3.7 kWh; no second history trade. |
| Restart/reload | Both accounts reopened requests, history, and the same transaction details. |
| History direction/totals | Provider: Sent, Shared 0.5 / Received 0.0. Requester: Received, Shared 0.0 / Received 0.5. |
| Filters | Correct completed/rejected request rows; empty Pending filter; empty opposite-direction history filters. |
| Empty own requests | Provider sees "No requests yet", without samples. |
| Detail navigation | Saved UUID opens from approval, completed request rows, and history; return button matches the source. |
| Refresh history | Refresh completes and retains the saved trade. |

Saved transaction UUID: `e3bed65b-5b06-41ce-870e-330558931bec`.

Reference: `TXN-E3BED65B5B0641CE870E330558931BEC`.

The three older pending requests from Pawan Menuka were left untouched.

### Live database verification

The user ran the entire `PHASE_6_VERIFY.sql` in Supabase SQL Editor. All ten assertions returned PASS:

- approval_atomic_result
- direct_write_guards
- insufficient_surplus_no_changes
- pending_submission_and_insert_guard
- rejection_no_transfer
- repeat_approval_no_duplicate
- requester_sees_outcomes
- rpc_grants
- unrelated_request_read_and_actions
- unrelated_transaction_access

The script uses the actual authenticated role and JWT identities, including an unrelated non-admin member. It creates temporary requests with explicit negative IDs and rolls back the requests and transactions; it does not advance the request sequence. It does not change sensor records, policies, or functions.

Earlier independent access verification also returned: authenticated role, unrelated member selected, admin false, visible transactions 0.

### Automated verification

20 focused Node tests pass. Run from the repository root:

```powershell
node --test src/trade/context/TradeContext.test.cjs src/trade/services/requestService.test.cjs src/trade/services/transactionService.test.cjs src/trade/utils/transactions.test.cjs
```

Coverage includes account scoping, numeric/status/date mapping, missing/inaccessible details, history pagination, reversed totals, failed reads and recovery, failed approval retaining pending state, late account responses, and overlapping refreshes. The context tests use an isolated hook harness with mocked services; they do not mount the native UI.

Production web export also passed: Expo bundled 2,402 modules successfully into the ignored local `.expo/phase6-export` directory. No build output or environment values are included in the commit.

## Verification limits and final team checks

- Repeated approval was tested against the live database sequentially. Simultaneous approvals from two devices were reviewed through the request/provider locks and unique index, but were not exercised in parallel sessions.
- Failed reads and retries were tested with simulated service failures. A real network outage while using the UI has not been exercised.
- Browser checks used Expo web. Before the semester demonstration, run a physical-device smoke test for scrolling, pull-to-refresh, modal actions, and back navigation.
- The migration was tested on the team's live project inside a rollback transaction; it has not been applied from scratch to a separate clean test database.
- "Report an issue" still belongs to the separate complaint workflow; its existing placeholder was not integrated in this trade sprint.

These limits are recorded so the team can distinguish verified behavior from remaining release checks.

## Git and Jira handoff

| Story | Commit | Branch |
| --- | --- | --- |
| SOL-178 | `1878e24` | `codex/SOL-178-my-requests` |
| SOL-175 / SOL-176 | `11f799b` | `codex/SOL-175-176-approval` |
| SOL-176 | `de48bd4` | `codex/SOL-176-transaction-details` |
| SOL-177 | `3bc9744` | `codex/SOL-177-transaction-history` |

The final verification branch is `codex/SOL-175-178-final-verification`. These branches are cumulative: the final branch includes the implementation commits above. Review one final diff against the team's intended merge target rather than cherry-picking the same commits more than once.

Only `src/trade` was changed for the component implementation and verification. The shared migration was separately approved by the user. The main checkout's existing changes and teammate modules were preserved. Local `.env` values are ignored and are not committed.

After the final team checks, review and merge through the team's normal process, then move the Jira stories to the appropriate reviewed/tested status. Pushing story-keyed commits does not itself transition Jira issues.
