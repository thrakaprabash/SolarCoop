# SOL-182 / SOL-183 — approved analytics fixture manifest

Created and verified: 4 October 2026, Asia/Colombo. These are synthetic campus-project test readings, not sensor measurements. The user approved retaining them for now. No cleanup has been performed.

## Creation evidence supplied by the user

- Result: CREATED.
- Account: SolarCoop Test Requester, user ID `17c39242-938c-44bd-81d9-f75281e27845`.
- Created energy_records IDs: `10, 11, 12, 13, 14, 15, 16, 17, 18`.
- Maximum database-generated surplus: `0`.
- The approved script required that this account had no readings; it inserted nine and overwrote none. surplus_kwh is a generated column and was omitted from INSERT.
- Existing requests, transactions and provider readings were not changed by this script.

## Direct browser verification

| Indicator | Expected | Observed |
| --- | --- | --- |
| Latest reading | 4 October | 2026-10-04 |
| Today's consumption so far | 15 kWh, latest snapshot only | 15.0 kWh |
| Previous seven-day average | 10 kWh/day | 10.0 kWh/day |
| Baseline coverage | 7/7 completed days | 7 of 7 |
| Comparison | 50% above average, provisional | 50.0% above, provisional |
| Last three completed-day consumption | 8 → 6 → 4 kWh | Decreasing trend |
| October generation | 24 kWh | 24.0 kWh |
| Estimated solar coverage | 24 / 33 × 100 | 72.7% |
| Generation/matched coverage | 4/4 October days | 4 generation days, 4 matched days |
| Completed outgoing October sharing | No outgoing October trades | 0.0 kWh |

Both screens loaded through the normal authenticated Supabase reads. Insights Sync returned the same values. Screenshots: `evidence/sprint4/daily-insights-fixtures.jpg` and `daily-impact-fixtures.jpg`.

These fixed readings age naturally. After 4 October, the current-day value becomes missing unless a new reading is added, and baseline coverage changes. Do not alter the clock or relabel old test data as current measurements for a demo.

## Cleanup — do not execute without a separate cleanup decision

The user-supplied creation manifest returned this exact scoped statement:

```sql
delete from public.energy_records
where user_id = '17c39242-938c-44bd-81d9-f75281e27845'
  and id in (10,11,12,13,14,15,16,17,18);
```

Inspect those IDs before any later cleanup. Do not delete all of this account's readings or unrelated test data. This manifest records the cleanup action; it does not authorize execution.
