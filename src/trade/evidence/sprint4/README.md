# Sprint 4 visual evidence

Prepared: 4 October 2026. Browser screenshots do not prove native-phone testing or completed daily calculations.

## Screenshots supplied by the user

Copies preserve the original bytes; source/destination SHA-256 hashes matched. Each was reviewed when supplied in this chat. No profile/credential screens are included.

| File | What it shows |
| --- | --- |
| [requester-insights.png](requester-insights.png) | Correct requester name, no energy records, unavailable daily insights. |
| [requester-impact.png](requester-impact.png) | October 1–3 period, no energy records, zero outgoing sharing, unavailable solar metrics. |
| [provider-insights.png](provider-insights.png) | Provider name, August 26 reading, no reading today, guarded 3.7 kWh balance. |
| [provider-impact.png](provider-impact.png) | Provider August reading, October 1–3 period, zero October sharing. |
| [impact-offline.png](impact-offline.png) | Energy and ledger errors, Try Again, unavailable sharing instead of false zero. |
| [impact-recovered.png](impact-recovered.png) | Errors cleared, reading and zero sharing restored; period updated to October 4. |

## Direct browser language checks

Captured after browser control reconnected on 4 October. Existing provider account was used; no requests, trades, readings, or profile fields were changed. Language was switched through the existing controls for the planned checks and restored to English afterwards.

- [Sinhala Insights](sinhala-insights.jpg)
- [Sinhala Impact](sinhala-impact.jpg)
- [Sinhala Impact lower content](sinhala-impact-lower.jpg)
- [Tamil Insights](tamil-insights.jpg)
- [Tamil Impact](tamil-impact.jpg)
- [Tamil Impact lower content](tamil-impact-lower.jpg)

Text selection, dates, guarded balance, shared totals, and scroll reachability were checked. These are rendering checks, not a native-speaker translation review. The Tamil Impact card-width defect found during these checks is recorded in the bug log; Tamil Impact screenshots show the verified fix after restart/reload. Sinhala captures precede that width fix and showed no card overflow. The shared Tamil bottom navigation remains crowded; it was not edited.

## Provider P2P rehearsal

Checked in the signed-in browser on 4 October using existing saved records:

- [Incoming requests](provider-incoming.jpg): completed and rejected requester tests; three older pending requests left untouched.
- [Transaction details](provider-transaction.jpg): completed 0.5 kWh, You -> SolarCoop Test Requester, matching saved reference.
- [Provider history](provider-history.jpg): September sent trade and zero October totals.

Received filter showed no received transactions; Sent showed the saved outgoing trade. Done returned to Incoming Requests, Back to History returned to history, and Sync restored the saved row. Energy opened Insights from history and showed the 3.7 kWh trade balance; P2P reopened Available Community Energy. No live requests or transfers were created. Account-switch and recording remain open. The user selected a web-browser demo; native device checks are outside this demo scope.

## Requester account-switch rehearsal

Checked on 4 October after the user switched from provider to SolarCoop Test Requester:

- [Insights after switch](requester-switch-insights.jpg): requester greeting and no readings; provider August reading and 3.7 kWh balance absent.
- [Impact after switch](requester-switch-impact.jpg): October 1–4 period, zero outgoing sharing, unavailable solar metrics; Sync completed.
- [Saved request outcomes](requester-outcomes.jpg): completed and rejected 0.5 kWh tests.
- [Requester transaction](requester-transaction.jpg): Vihanga Perera -> You, ENERGY RECEIVED, same saved completed reference.
- [Requester history](requester-history.jpg): September received trade and zero October totals.

Back to My Requests returned correctly. Browser reload retained the session and reopening My Requests restored both outcomes. This verifies settled UI after the account switch, not every intermediate frame or concurrent in-flight account change. No new live data was created. Profile/credential screens were excluded from evidence.

## Daily analytics after contract adoption

The user adopted latest snapshot per Colombo day as daily accumulated kWh. Current requester browser checks: [Insights](daily-insights-empty.jpg), [Impact](daily-impact-empty.jpg). With no readings, daily values remain unavailable, baseline coverage is 0/7, and October coverage is 0/4. Completed outgoing sharing remains independently valid at 0.0 kWh. Lower Impact explanations/SDGs remain reachable by scrolling. These are live empty-state checks; positive numeric rendering is not yet verified with live test data. Earlier screenshots/copy predate this contract adoption.

History offline check supplied by the user: [original error state](history-offline-before.png). Loading ended, Try Again appeared, and the saved September transaction remained visible. The raw fetch error and unlabelled cached totals prompted a component-only copy/state fix. The user subsequently reported the updated History and Insights offline checks work fine; no updated offline screenshots were supplied. Direct browser checks after reconnection verified History Sync restored the saved received trade and Insights Sync ended with the requester no-readings state, without errors. Recovery captures: [History](history-recovered.jpg), [Insights](insights-recovered.jpg).

## Still needed

- P2P recording and playback review; new live actions only if separately authorized.
- Positive-data live analytics check under the adopted snapshot convention.
- Native phone checks remain unverified outside the selected browser-demo scope.
