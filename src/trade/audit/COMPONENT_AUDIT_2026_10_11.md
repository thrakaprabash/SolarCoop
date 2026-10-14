# Pawan's SolarCoop component — test report

**Historical audit:** see [repair status and current verification](REMEDIATION_2026_10_11.md) for the subsequent fixes. Original reproduction evidence below is preserved.

**Date:** 11 October 2026

**Checkout tested:** `develop`, commit `bd41b02`

**Scope:** P2P browsing, request submission/review, transaction history/details, Smart Energy Insights and Sustainability Impact under `src/trade`.

## Result

**10 confirmed defects:** six P2 issues and four P3 issues. No P0/P1 issue was demonstrated in these checks. This is the set found in this audit, not a guarantee that no other defects exist.

| Check | Result |
| --- | --- |
| Existing component tests | **48/48 passed** |
| New targeted defect reproductions | **9/9 fail their expected-behavior assertions**, demonstrating A01–A09 |
| Current baseline trade database subset in isolated PGlite | **All 10 Phase 6 assertions passed** |
| Production Expo web export | **Passed**, 2,376 modules |
| Signed-in browser smoke checks | Search, validation, navigation, empty history, Insights, Impact and confirmation cancellation passed |
| Narrow transaction-reference layout | **Overflow reproduced**, A10 |

Only audit files were added within `src/trade/audit`. Application code, teammate files, Git history and the shared database were not changed. Browser tests did not submit, approve or reject live requests.

## Confirmed defects

P2 means normal-priority functional or data correctness work. P3 means lower-priority presentation, accessibility or unusual-data work. Conditional scale/timezone cases are described explicitly; they were reproduced locally rather than manufactured in the live database.

| ID | Priority | Finding | Evidence |
| --- | --- | --- | --- |
| A01 | P2 | Amount stepper can exceed the provider's actual balance or produce zero | Real screen callbacks; failing test |
| A02 | P2 | Editing during submission attaches the old request's confirmation to the new form amount | Deferred submission using real screen callbacks; failing test |
| A03 | P2 | Both request lists silently stop at the API row cap | Actual service functions with a capped API stub; failing test |
| A04 | P2 | A trade inserted between history pages duplicates an existing ledger row | Actual service function with a changing paginated response; failing test |
| A05 | P2 | History and Impact disagree about the reporting month outside the Colombo timezone | Actual helpers on a UTC test device; failing test |
| A06 | P3 | Daily normalization can choose an older snapshot when timestamps differ only by microseconds | Actual adapter with valid PostgreSQL timestamp strings; failing test |
| A07 | P2 | “Report an issue” only displays a toast claiming the complaint form opens | Actual detail-screen callback; failing test |
| A08 | P3 | Transaction/request date formatting ignores the selected language | Actual TransactionCard rendered with Sinhala selected; failing test |
| A09 | P3 | Primary actions do not announce button role or disabled state | Actual component props plus live browser DOM; failing test |
| A10 | P3 | A full transaction reference overflows its card on a 320px screen | Real React Native Web Card/DetailRow styles in a static browser fixture |

### A01 — Amount stepper breaks the balance limit

**Location:** `screens/EnergyRequestScreen.js:41`; related display precision in `utils/format.js:1`.

Reproduction: provide a household with 0.25 kWh available, open its request form and press minus. The screen clamps to 0.25, then rounds to one decimal place, producing **0.3**. Its own validation rejects that value. With a 0.04 kWh balance it produces **0.0**; with 1.25 kWh it produces **1.3**.

Expected: stepping must leave a positive value no greater than the actual balance. The displayed available amount and validation message must also preserve enough precision to explain the limit. Manual entry remains a workaround; it does not repair the stepper.

Suggested fix: define a consistent supported precision, preserve valid fractional maxima, and use the same precision in availability, input and confirmations. Keep the database's surplus guard.

### A02 — Confirmation and edited amount disagree

**Location:** `screens/EnergyRequestScreen.js:50` and `screens/EnergyRequestScreen.js:121`.

Reproduction: submit 2.5 kWh with the response delayed, then edit the input to 1.0 while submission is pending. Resolve the original submission successfully. The input shows **1.0**, while the success message confirms **2.5**, and the confirmation disables the submit action for the edited form.

The saved request uses the original 2.5 kWh; this test did not demonstrate a wrong database amount. The defect is the conflicting form state and confirmation.

Suggested fix: disable the input and both stepper controls while submitting, or version the form so a completed operation cannot set confirmation on a subsequently edited form.

### A03 — Request lists omit older rows

**Location:** `services/requestService.js:45` and `services/requestService.js:87`.

Both functions issue one query without pagination. With 1,001 matching requests and a server cap of 1,000, each returns **1,000**, with no warning. An older pending request can therefore disappear from the list and pending count.

The live project's configured row cap was not inspected; 1,000 is the explicit condition modelled in the test. The failure applies at whatever cap the server enforces.

Suggested fix: paginate both lists using stable timestamp/ID ordering or implement explicit paginated UI with accurate counts. Batch profile lookups as well; those currently also use a single unbounded `.in()` query.

### A04 — Concurrent additions duplicate history rows

**Location:** `services/transactionService.js:8` and `services/transactionService.js:20`.

Reproduction: the first descending page returns 500 trades. A new trade is inserted at the top before the next query. Offset 500 now returns the last trade from the first page again. The service returns **501 rows containing only 500 distinct transaction IDs**.

The UI uses those rows for cards and sums. Duplicate IDs cause duplicate React keys and double-count that transaction within the fetched result.

Suggested fix: use keyset pagination over `(created_at, id)`, preferably with a fixed upper bound for the read, and deduplicate IDs defensively. Adding only a second sort key does not stop offset shifts.

### A05 — Reporting month depends on device timezone

**Location:** `utils/transactions.js:24`, `utils/format.js:28`; compare `services/energyAnalyticsService.js:4`.

Reproduction: on a UTC device, calculate October totals for a completed outgoing trade at `2026-09-30T19:00:00Z`. In Colombo that is **1 October, 00:30**. Impact's October period includes it, while History's October total is **0** and its grouping puts the trade in September.

Expected: the two features must use the same documented reporting calendar. The discrepancy is conditional on device timezone and boundary timestamps.

Suggested fix: use Asia/Colombo month/day keys consistently for grouping, totals and displayed timestamps, or explicitly define and label a different history timezone.

### A06 — Microsecond ordering is lost

**Location:** `utils/dailyEnergyReadings.js:11` and `utils/dailyEnergyReadings.js:19`.

Reproduction: ID 11 is recorded at `12:00:00.000100Z` with production 1, while ID 10 is recorded later at `12:00:00.000900Z` with production 2. Both parse to the same JavaScript millisecond. The adapter selects ID 11 and reports **1** instead of the latest **2**.

This requires distinct timestamps within one millisecond and IDs that do not follow timestamp order, such as imported/backfilled records. PostgreSQL timestamps support this input; IDs alone cannot resolve it correctly.

Suggested fix: preserve sub-millisecond ordering before applying the exact-timestamp ID tiebreaker, or normalize daily totals server-side using PostgreSQL ordering. A server-side change would require separate approval.

### A07 — Report action is a placeholder

**Location:** `screens/TransactionDetailsScreen.js:145`.

Reproduction: invoke “Report an issue with this transaction.” The callback only calls `showToast`; it does not open a form or reporting flow. The English toast says **“Complaint form opens in the complaints module”**, which describes an action that has not happened.

Suggested fix: connect a real reporting entry point with transaction context, or replace the action with accurate guidance. Changes to the teammate's complaints navigation/module require approval before implementation. This is an integration defect, not a failure of transfer completion.

### A08 — Date localization is incomplete

**Location:** `utils/format.js:22`; related request formatters in `services/requestService.js:12`.

Reproduction: render a transaction card with Sinhala selected. It still displays **“11 Oct”** because the date helpers hardcode `en-GB`/`en-US`. Month headings, detail timestamps and request dates use the same English-only approach. Tamil is affected by the same code path.

Expected: dates and month headings follow the chosen UI language. The test only demonstrates the formatting defect, not the quality of the surrounding translations.

Suggested fix: pass the resolved locale into component-owned formatters and format raw request timestamps when rendering, so changing language does not retain preformatted English text.

### A09 — Disabled action has no accessible disabled state

**Location:** `components/ui/PrimaryButton.js:23`; similar role/label gaps occur on stepper controls.

Reproduction: enter zero in the live request form. Validation appears and pressing is blocked by removing `onPress`, but the action's DOM remains a `DIV` with `tabindex="0"`, **no button role and no `aria-disabled`**. The actual component also supplies neither `disabled` nor an accessible disabled state to Pressable.

This does not demonstrate that an invalid request can be submitted. It means assistive technology cannot reliably identify the action or its disabled state. The amount input and icon-only stepper controls also lack explicit accessible labels.

Suggested fix: supply button roles, real disabled props/states and meaningful accessible labels inside the component. Verify keyboard and screen-reader behavior on web after the changes.

### A10 — Transaction reference exceeds narrow card width

**Location:** `components/ui/DetailRow.js:21`; used by `screens/TransactionDetailsScreen.js:135`.

Reproduction: render the actual Card and DetailRow with the normal reference format, `TXN-E3BED65B5B0641CE870E330558931BEC`, at a 320px screen width with the screen's 16px side padding and card's 18px padding. Browser measurement found the value's right edge **29.5px beyond the card**. The 375px and 430px English fixtures did not overflow the outer card.

The fixture uses synthetic data and real React Native Web component styles. It is not a physical-device test or a screenshot of the current account's ledger, which is empty.

Suggested fix: give the label/value constrained, shrinkable widths and a wrapping strategy for the unbroken reference, or put this reference on its own full-width row. Preserve the full ID.

## Additional test coverage gap

**C01 — `npm test` omits component tests.** `package.json:38` runs only `tests/*.test.cjs`. None of the 48 existing `src/trade` tests are discovered by that command. There is no `.github` workflow in this checkout supplying a separate component test gate.

This is a test configuration gap, separate from the 10 product defects. Add an explicit trade test command or include these tests in the project's standard check. Editing the shared `package.json` requires approval. Keep the audit reproductions separate until their defects are fixed: they deliberately assert expected behavior and currently fail.

## Browser checks completed

Signed-in account visible in the UI: **Sanduni Fernando**. No credentials were read or saved in the audit.

- Provider list loaded; searching a nonexistent name showed the no-match state. Searching “Vihanga” returned the matching household.
- Request form rejected zero and an amount above available energy. Entering `1,5` produced the expected $0.33 estimate. No submission was made.
- History loaded a legitimate empty state with 0.0 sent/received totals for this account.
- Insights loaded current dated readings, consumption, baseline coverage and a provisional comparison.
- Impact loaded generation, 0.0 completed outgoing shared energy and estimated solar coverage, with a partial-month coverage explanation.
- Incoming Requests showed one pending 1.0 kWh request. Approval and rejection confirmation dialogs opened and were cancelled. Returning to the list still showed PENDING.

Live values changed during testing because the existing simulator was updating them. These observations confirm loading/navigation behavior; they are not a reconciliation against an independently measured energy source.

## Database checks completed

`database-guards.test.cjs` loads the current baseline's four relevant tables, generated surplus column, trade functions, policies, indexes, foreign keys and grants into a disposable PostgreSQL-compatible PGlite instance. It supplies minimal local Auth infrastructure and synthetic accounts, then runs the existing Phase 6 rollback script.

All assertions passed: atomic approval, direct-write guards, insufficient-surplus rollback, pending insert guard, rejection without transfer, repeated approval without duplicates, requester outcomes, RPC grants, unrelated-member request/action restrictions and unrelated transaction access.

This verifies the extracted trade subset. It does **not** claim that the full shared migration chain was deployed from scratch or that the live Supabase deployment exactly matches it. PGlite also does not establish simultaneous independent-session locking behavior.

## Reproduce the results

From the repository root in PowerShell:

```powershell
$tradeTests = Get-ChildItem -LiteralPath 'src/trade/utils','src/trade/services','src/trade/context' -Filter '*.test.cjs' -File | Select-Object -ExpandProperty FullName
node --test @tradeTests
node --test src/trade/audit/database-guards.test.cjs
node --test src/trade/audit/component-audit.test.cjs
node src/trade/audit/visual-fixtures.cjs --serve
```

The third command currently exits with code 1 for nine expected-behavior failures. That is the saved reproduction evidence, not nine new code changes causing regressions. The last command serves synthetic static layout fixtures at `http://127.0.0.1:8085/`; stop it with Ctrl+C when finished. Generated HTML is also saved beside the script.

Saved outputs: `existing-tests.tap`, `component-audit.tap`, `database-guards.tap`. Web export output is ignored under `.expo/trade-audit-20261011`.

## Verification still needed

- Recheck fixes against a populated live transaction ledger and both provider/requester accounts.
- Test real network outage/recovery in this current build; this audit used local service failures and retained earlier outage evidence only as history.
- Test independent simultaneous approval sessions against an isolated full PostgreSQL/Supabase environment.
- Physical Android/iOS behavior, screen readers and narrow translated layouts remain unverified in this audit. The declared demonstration target is web.
- The shell used Node 20.20.2. Expo SDK 57 documents Node 22.13 or newer as its minimum. The web export succeeded, but subsequent verification should use the supported runtime: [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).

## Recommended repair order

1. A01, A02 and A07: visible request/reporting behavior.
2. A05 and A04: consistent reporting and ledger correctness.
3. A03: complete request history and accurate pending counts at scale.
4. A10, A09 and A08: narrow-screen, accessibility and language polish.
5. A06: timestamp precision edge case.
6. C01: standard test integration, with approval for the shared configuration edit.

Most repairs fit entirely within `src/trade`. Ask before changing the complaints integration, shared test configuration, shared database or teammates' modules.
