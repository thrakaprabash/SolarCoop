# SOL-182 / SOL-183 — daily calculation rules

Prepared: 4 October 2026. Status: pure calculation engine implemented and fixture-tested; live daily integration remains unavailable.

`utils/energyAnalytics.js` accepts **already normalized daily totals**, one reporting-calendar date per day. It does not normalize raw energy_records or assume that their rows are daily totals. The caller must establish that contract explicitly. With the default `contractConfirmed=false`, all metrics remain unavailable even for plausible-looking inputs.

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

These are explicit local test fixtures. They do not seed live records or prove the meaning of the shared energy source. The live screens still show unavailable daily metrics, as verified in the user's screenshots. No sensor, database, shared translation, or teammate file changed.

## Remaining integration gate

Connect a verified daily-normalization adapter and bounded account-scoped historical reads before displaying these calculations. Unknown raw readings must never be passed with contractConfirmed=true. This engine prepares the calculation work; it does not close SOL-182/SOL-183 live calculation acceptance.
