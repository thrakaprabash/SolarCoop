# SOL-182 / SOL-183 — analytics implementation evidence

Date: 3 October 2026. Status: real read/state integration implemented; daily calculations remain unavailable.

## What changed

- Removed sample ENERGY and IMPACT exports and their TradeContext values. Static SDG metadata remains.
- Insights uses the signed-in profile's name when available, with a neutral title otherwise.
- Both screens read the current user's latest energy record, show its Colombo date and missing/current/future-date status, and support entry reload, retry, and pull-to-refresh.
- A reading is not treated as a daily total. Consumption averages/trends, generated-energy totals, and Estimated solar coverage show unavailable under the unresolved data contract.
- Insights reads the existing guarded trade balance independently. A positive available balance is shown only after a successful provider read; it does not use raw production minus consumption.
- Impact reads only completed outgoing trades between Colombo month start and the refresh timestamp. Rows are ordered and paginated. Received/reversed rows are excluded. Empty successful ledger reads yield genuine zero; failed reads yield unavailable.
- Energy/ledger loading and errors are independent. Refresh clears stale values. Old-account data is hidden immediately, and late/overlapping reads cannot replace the current result. Unmount invalidates pending updates.
- No shared code, translations, database schema/policies, or live records were edited.

## Verification

30 Node tests passed: the existing 20 trade checks and 10 new service/hook checks. The new checks cover Colombo month boundaries, own-record scope, ledger filters/pagination, zero versus failure, invalid amounts/dates/participants/statuses, independent source failures, retries, account switches, and overlapping refreshes.

Production Expo web export passed with 2,405 modules into ignored `.expo/sprint4-analytics-export`. No dependencies or package manifests changed. The earlier installed-dependency snapshot limitation remains in the Phase 0 contract.

```powershell
node --test src/trade/services/energyAnalyticsService.test.cjs src/trade/context/useEnergyAnalytics.test.cjs src/trade/context/TradeContext.test.cjs src/trade/services/requestService.test.cjs src/trade/services/transactionService.test.cjs src/trade/utils/transactions.test.cjs
```

These hook checks use an isolated state harness, not a mounted native screen. Browser verification of the new analytics UI was attempted twice, but the browser-control connection reported Transport closed. It remains pending. The previously recorded SOL-179 navigation checks predate these analytics changes.

## Remaining acceptance work

- [ ] Verified daily normalization and supported consumption rules/generation/coverage calculations. User directed us to continue without a teammate dependency; this does not supply missing measurement semantics.
- [x] User-provided screenshots of Insights/Impact on the current test account: no energy records, correct account greeting, October reporting period, zero shared energy, and unavailable solar indicators.
- [ ] Successful refresh/retry in the browser; screenshots alone do not verify these actions.
- [ ] Provider UI check with a stale reading and current guarded balance.
- [ ] Physical-device and real network recovery checks.
- [ ] Localization of the new status/explanation text. Existing translated tabs, headings, and shared action labels are preserved; new explanatory text is currently English.

SOL-182 and SOL-183 are partially implemented, not fully accepted. No fake daily figures or sample greetings remain in their live paths.

## User-provided Insights screenshot

The screenshot shows the signed-in SolarCoop Test Requester greeting, no energy readings for this account, Sync, and unavailable daily consumption calculations. The previous Menuka greeting and sample figures are absent. This verifies the rendered no-record state only, not a successful refresh or measured-data calculation.

The user reports identical results under Household and Co-op. The global selector is owned by shared EnergyContext/Header. App.js passes only initialScreen to TradeModule; component analytics deliberately reads the signed-in user's data and does not consume viewScope. Thus changing the selector does not select community-wide analytics. A community analytics mode would require an agreed scope/data-access contract; it is not implemented or authorized by this screenshot. No shared selector code was changed.

## User-provided Impact screenshot

The screenshot shows month-to-date 2026-10-01 to 2026-10-03 (Asia/Colombo), no energy readings for the account, shared energy 0.0 kWh, and unavailable solar generation/Estimated solar coverage. The sample totals and self-sufficiency percentage are absent. Zero October outgoing sharing is consistent with the saved September received trade being excluded. This is visual evidence; no additional database reconciliation, refresh, provider login, or network recovery was performed from the screenshot.
