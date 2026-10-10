# Component audit repairs — 11 October 2026

Scope: Pawan's component under `src/trade`, based on `develop` at `bd41b02`.
The user explicitly requested that all changes stay inside this component.
Shared navigation, teammates' files, package scripts and the live database were not changed.
Changes are local and uncommitted.

## Repair status

| Finding | Status | Change |
| --- | --- | --- |
| A01 — fractional request amounts | Fixed | Stepper preserves the provider maximum, including 0.25/0.04/1.25 kWh. Trade cards, confirmations and balances retain fractional precision. Decimal addition/subtraction avoids floating-point display noise. |
| A02 — editing during submission | Fixed | Input and steppers are disabled while saving; a ref also guards queued callbacks. Confirmation stays attached to the submitted amount. |
| A03 — truncated request lists | Fixed | Both lists read successive timestamp/ID cursor pages. Profile names are loaded in batches of 100. |
| A04 — duplicate history rows | Fixed | History uses a timestamp/ID cursor instead of increasing offsets. Both participant filtering and cursor filtering apply to subsequent pages. Newer inserts no longer shift the page boundary. |
| A05 — inconsistent reporting month | Fixed | History totals and month groups use Asia/Colombo, matching Impact. Decimal monthly totals remain accurate for small trades. |
| A06 — microsecond ordering | Fixed | Daily snapshots preserve the fractional microseconds discarded by JavaScript dates. The ID tie-breaker applies only to equal timestamps. |
| A07 — placeholder report action | Mitigated; integration pending | Removed the false “form opened” toast. Details now shows English/Sinhala/Tamil guidance for opening Alerts and reporting the displayed transaction reference. Direct navigation/prefilling still needs shared-file changes, which the user declined. |
| A08 — English-only trade dates | Fixed | Request and transaction screens format raw timestamps using the selected English/Sinhala/Tamil language and Colombo timezone. Month labels update with language. |
| A09 — missing accessibility state | Fixed | Primary buttons expose button role and disabled state; request input and amount steppers have accessible labels. |
| A10 — narrow reference overflow | Fixed for web | Detail labels/values can shrink and wrap; long references wrap inside the card. Web-only wrapping is guarded by Platform.OS. |
| C01 — component tests omitted by root command | Component workaround added | `node src/trade/audit/run-tests.cjs` discovers and runs all component test files. The shared `npm test` command remains unchanged and still does not discover these tests. |

## Verification

- **62 tests passed, 0 failed, 1 explicitly skipped.** This includes the original 48 component tests, audit regressions, additional precision/profile-batching/timezone checks, and the local database test.
- The skipped check is direct complaint navigation, outside the approved scope. Reporting guidance has a separate passing check; the skipped check is not counted as a fix.
- The isolated PGlite database test passed **all ten Phase 6 SQL assertions** for approval, repeat approval, insufficient surplus, rejection, member visibility, direct writes and RPC grants. It does not connect to Supabase.
- **Expo production web export passed: 2,377 modules**, using Node **24.19.0**. Output is ignored under `.expo/trade-fixes-20261011`.
- Real React Native Web `DetailRow` and `Card` fixtures were inspected in the browser at **320, 375 and 430 px**. All three references stayed inside their cards, with text scroll width equal to client width and **0 px overflow**.
- `git diff --check` passed. Tracked source edits are all inside `src/trade`.

### Browser measurements

| Fixture width | Reference right edge | Card right edge | Overflow | Text scroll/client width |
| --- | --- | --- | --- | --- |
| 320 px | 297.20 px | 316 px | 0 px | 160 / 160 px |
| 375 px | 352.20 px | 371 px | 0 px | 197 / 197 px |
| 430 px | 407.20 px | 426 px | 0 px | 234 / 234 px |

### Reproduce

From the repository root, using Node 22.13 or newer:

```powershell
node src/trade/audit/run-tests.cjs
node src/trade/audit/visual-fixtures.cjs --serve
```

The second command serves static synthetic fixtures at `http://127.0.0.1:8085/`; stop it with Ctrl+C after inspection.
Current test output: `after-fixes.tap`. Build output: `web-export-after-fixes.log`.
The original audit report and original failing TAP output remain as historical evidence.

## Remaining checks and limits

- The existing browser session at `http://localhost:8084/` displayed **Pending Admin Validation** after reload. A fresh signed-in trade smoke test could not proceed with that account. No account status or live data was changed.
- Cursor paging was verified with deterministic API fixtures, including an insertion between pages and 1,001 requests. The live deployment's second-page PostgREST request still needs an account with enough records or a separate isolated integration environment.
- Physical Android/iOS, screen readers and narrow translated layouts were not verified. The declared demo target is web.
- Simultaneous approvals from independent database sessions and a fresh real-network outage/recovery rehearsal remain integration checks; the local SQL test is not proof of cross-session concurrency.
- Direct complaint navigation and integration into the shared default test command remain pending by the user's scope decision.

No commits or pushes were made during these repairs.

## Demonstration follow-ups

- Trade energy displays now use two decimal places; positive values below 0.01 kWh display `<0.01`. Request validation and calculations retain the original values.
- The provider list now retains approved solar owners without surplus. Their request buttons remain disabled, and the pool denominator includes them. The current member's own household and owners awaiting approval remain excluded.
- Final component verification after these follow-ups: **63 passed, 0 failed, 1 skipped** (64 checks). The skipped check remains shared complaint navigation.
- Generated TAP, HTML and build logs are local artifacts, excluded from Git; the scripts and reports are committed for reproducibility.
