# SOL-182 / SOL-183 — daily calculation rules

Updated: 4 October 2026. Status: daily calculations connected under the user-adopted latest-snapshot convention; approved synthetic readings verified through the live browser on 4 October.

`utils/energyAnalytics.js` accepts **already normalized daily totals**, one reporting-calendar date per day. It does not normalize raw energy_records or assume that their rows are daily totals. The caller must establish that contract explicitly. With the default `contractConfirmed=false`, all metrics remain unavailable even for plausible-looking inputs.

The user has now adopted daily cumulative snapshots as the project convention. `utils/dailyEnergyReadings.js` normalizes bounded history into one latest snapshot per Colombo day. Timestamp ties use exact bigint IDs. The hook enables the calculation engine only after that adapter; it reloads on entry/account change/Sync and rejects late results. This is an adopted project interpretation, not independently measured source semantics.

## Rules

- Previous seven completed calendar days, excluding today. Average valid consumption days only; return baselineDays/7 coverage. Zero is valid; missing is unavailable.
- Today's valid consumption is a provisional comparison to completed-day average. Above +10% is higher, below -10% lower, otherwise in line. Display rounding does not decide the band; a machine-precision tolerance avoids floating-point boundary drift.
- Zero baseline gives an absolute comparison with no percentage. Missing current/baseline values yield no comparison.
- Trend uses the three immediately preceding completed calendar days in chronological order. Gaps, duplicate dates, invalid values, or equal/non-monotonic consumption do not generate a trend.
- Generation is month-to-date production from valid observed days, with generationDays coverage. No observations yield unavailable; observed zero yields zero.
- Estimated solar coverage uses sum(min(production, consumption)) / sum(consumption) on matched valid days within the same month-to-date window. Production surplus on one day cannot cover another day's consumption. This is the user-approved energy-balance estimate, not measured solar self-consumption.
- Duplicate dates are unavailable rather than guessed, summed, or overwritten. Null/blank/boolean/negative/nonfinite values are not zero. Dates must be valid YYYY-MM-DD reporting dates. Numeric strings are accepted. Overflow and zero denominators yield unavailable.

## Verification

Ten focused tests cover unknown-contract gating, a cross-month seven-day window, missing/zero observations, input order/duplicate days, invalid amounts/dates, zero baseline, threshold boundaries, consecutive-day trends, daily solar alignment, and overflow.

```powershell
node --test src/trade/utils/energyAnalytics.test.cjs
```

These are explicit local test fixtures. They do not seed live records or independently prove the meaning of the shared energy source. The live screens now calculate when suitable readings exist under the adopted convention; the current requester still shows unavailable values because it has no readings. No sensor, database, shared translation, or teammate file changed.

## Live integration verification

Positive-data check completed after the approved revised fixture script returned CREATED with IDs 10–18 and maximum generated surplus 0. Insights and Impact matched all expected values, including latest-only current 15, average 10, 50% higher provisional comparison, decreasing trend, October generation 24 and estimated coverage 72.7%. See SPRINT_4_ANALYTICS_FIXTURE_MANIFEST.md. The earlier pending statements below are superseded for this fixture check; independent real-sensor semantics and native checks are not established by synthetic data.

The adapter, bounded paginated reads, hook and both screens are connected. 48 tests pass, including history scoping/pagination, timestamp/Colombo boundaries, exact ID tie-breaks, invalid latest values, raw snapshots through calculations, independent read failures/retry and account races. Live empty-state rendering is verified. Positive-data browser verification requires suitable readings in a controlled account. The proposed `SPRINT_4_ANALYTICS_TEST_DATA.sql` creates explicitly synthetic requester-only fixtures and requires user approval before execution. It has not been executed or verified on the live database.
