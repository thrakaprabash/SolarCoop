# SOL-181 — Browser demo script

Prepared: 4 October 2026. Target: approximately 3–4 minutes, plus the account switch. Use existing saved test records; no new requests or approvals are needed for this recording.

## Before recording

- Run the preview at http://localhost:8082/ and sign in as SolarCoop Test Requester.
- Start on P2P Trade. Use a readable browser size and capture only the app.
- Keep login and Profile screens out of the recording. Pause the recording while switching accounts; the user enters credentials.
- Use your preferred screen recorder. This script and the screenshots are preparation; a video has not been recorded or verified yet.

## Walkthrough and narration

| Time | Show | Suggested narration |
| --- | --- | --- |
| 0:00–0:20 | P2P Trade → My Requests | “SolarCoop lets community members request available solar energy. Requests are saved to the database. Here are our completed and rejected test requests.” |
| 0:20–0:50 | Completed request → transaction details | “This 0.5 kWh request was completed by Vihanga Perera. Approval completes the transfer and creates one transaction. The requester sees it as energy received.” |
| 0:50–1:15 | Back to My Requests → overview → Transaction History | “History shows the saved September transaction. October totals are zero because this transfer belongs to September. Sync reloads the saved data.” |
| 1:15–1:40 | Energy → Insights | “Insights uses the signed-in account's real readings. This test account has no readings, so the app explains that instead of displaying sample figures.” |
| 1:40–2:05 | Impact | “Impact shows the reporting period and completed outgoing energy shared with the community. Received energy is excluded. Daily calculations use our latest-reading-per-day project convention. Missing readings remain unavailable, with coverage shown.” |
| Pause | Switch to Vihanga Perera without recording credentials | Resume on P2P Trade. |
| 2:05–2:35 | Incoming Requests → completed test request | “The provider sees the same completed request and the separate rejected request. The transaction reference matches, with energy sent from this account.” |
| 2:35–3:00 | Transaction History | “The provider's history records the same 0.5 kWh as sent. Rejection creates no transfer. We leave other members' pending requests untouched.” |
| 3:00–3:25 | Energy → Insights | “The provider has an August reading, clearly marked as old. The 3.7 kWh available balance comes from the guarded trade balance; it is not today's production.” |
| 3:25–3:45 | End on Impact or history | “The component handles account changes, missing readings, refresh failures, and retry. Daily calculations are connected using the last snapshot per Colombo day; today is marked so far. These accounts still need current-period readings to show numeric results.” |

Optional recovery segment: use the existing offline/recovery screenshots from `evidence/sprint4/README.md`, or record a deliberate offline refresh and reconnect/retry. Do not present a screenshot as a video of a new live action. Record the updated friendly History error if demonstrating that fix; the original offline screenshot predates it.

## Values to reconcile

- Both roles: COMPLETED, 0.5 kWh, 30 September 2026.
- Reference: `TXN-E3BED65B5B0641CE870E330558931BEC`.
- Requester: Vihanga Perera → You; ENERGY RECEIVED.
- Provider: You → SolarCoop Test Requester; ENERGY SHARED.
- Current October totals: 0.0 kWh for these accounts at verification time. Check again if new trades occur before presenting.
- Provider latest reading: 26 August 2026; available trade balance: 3.7 kWh at verification time.
- Impact period on 4 October: 1–4 October, Asia/Colombo. Later dates update naturally.

## Recording review

- Play the saved video from beginning to end; confirm text is readable and narration matches the screens.
- Check both directions and the same reference, with no profile contact details or credentials shown.
- Describe the saved completed/rejected outcomes accurately. This walkthrough does not record a new submission, approval, or rejection.
- If the rubric requires newly performed actions, arrange explicitly authorized disposable requests before that recording.
- Keep the video with your presentation materials. It has not been uploaded to GitHub or attached to Jira by this workflow.

## Sprint acceptance status

| Area | Evidence / remaining work |
| --- | --- |
| Baseline and component boundaries | Integrated baseline; implementation edits remain within src/trade. |
| Saved P2P participant walkthrough | Provider/requester outcomes, matching details/history, filters, routing, Sync and reload verified in browser. |
| Approval/rejection database guards | Earlier Sprint 3 rollback checks passed. New Sprint 4 action recording and simultaneous-session test remain open. |
| Error recovery | Impact screenshots verified; updated History/Insights offline checks reported successful by user, recovery verified directly. |
| Analytics source and state handling | Account-scoped reading/ledger reads, dates, zero/unavailable states and account switch verified. |
| Daily averages, trends, generation, coverage | Connected under user-adopted daily-snapshot convention; 48 tests pass. Positive-data live UI verification remains pending. |
| Regression | 40 tests and production web export passed after the latest History fix. |
| Demo | Script and screenshot evidence ready; video capture/playback review remains open. Browser selected by user; native device testing remains unverified. |
| Delivery | Story-keyed commits pushed to codex/SOL-179-sprint4-baseline. Jira completion and merge have not been performed. |

Do not mark every story or the entire sprint complete using this preparation document alone.
