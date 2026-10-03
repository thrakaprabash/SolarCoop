# Sprint 4 component bug log

Updated: 3 October 2026. Scope: src/trade.

| Finding | Evidence | Resolution/status |
| --- | --- | --- |
| Changing between Energy/P2P retains the prior route | Same TradeModule instance; NavigationProvider's initial useState does not rerun on entry prop change | Fixed under SOL-179, `6bad010`. Browser checked both directions; evidence `f9dc4e5`. |
| Analytics show seeded figures and a fixed Menuka greeting | Observed in the signed-in test account during navigation checks | Sample exports/context removed in `9efd7b2` (SOL-182/SOL-183). Real scoped reads and appropriate unavailable states implemented; latest UI check pending. |
| Daily energy aggregation semantics unknown | Only one August reading; no verified daily/interval/counter contract | Calculation acceptance dependency, not a database-access bug. User directed continuation without teammate changes. Do not fabricate daily totals. |
| New analytics explanatory text is English | Component-local text added without shared locale changes | Localization follow-up; existing translated tabs/headings preserved. |

No new SOL-180 code fix is claimed. Do not create a Jira Bug or change Jira status from this log without the user's instruction.

## Regression evidence and outstanding checks

- 30 automated tests pass and production web export passes (2,405 modules).
- Database policy/RPC/index checks confirmed with user-supplied results.
- Current analytics browser verification is blocked by the closed browser-control connection.
- Real network recovery, current provider flow/account switching, physical device, and simultaneous-session approval remain unverified.
- Shared database or teammate fixes require separate approval if a reproduced failure points outside src/trade.
