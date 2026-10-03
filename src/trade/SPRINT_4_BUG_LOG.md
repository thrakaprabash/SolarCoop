# Sprint 4 component bug log

Updated: 3 October 2026. Scope: src/trade.

| Finding | Evidence | Resolution/status |
| --- | --- | --- |
| Changing between Energy/P2P retains the prior route | Same TradeModule instance; NavigationProvider's initial useState does not rerun on entry prop change | Fixed under SOL-179, `6bad010`. Browser checked both directions; evidence `f9dc4e5`. |
| Analytics show seeded figures and a fixed Menuka greeting | Observed in the signed-in test account during navigation checks | Sample exports/context removed in `9efd7b2` (SOL-182/SOL-183). Real scoped reads and appropriate unavailable states implemented; latest UI check pending. |
| Daily energy aggregation semantics unknown | Only one August reading; no verified daily/interval/counter contract | Calculation acceptance dependency, not a database-access bug. User directed continuation without teammate changes. Do not fabricate daily totals. |
| New analytics explanatory text is English | Component-local text initially added without shared locale changes | Component-local EN/SI/TA translations added; all 15 keys and substitutions checked. Existing translated tabs/headings preserved. Visual language switch/wording review pending. |
| Tamil coverage label exceeds Impact card width | Direct narrow-browser rendering; inner row not constrained to card content width | SOL-180: constrain nested row width to 100%; refreshed browser confirmed wrapping. Final screenshot in evidence/sprint4/tamil-impact-lower.jpg. |
| Tamil shared bottom-navigation labels are crowded | Visible during the same narrow-browser checks | Teammate/shared code. Recorded for coordination; no edit made. |

The SOL-180 Impact card-width fix is component-local. Do not create a Jira Bug or change Jira status from this log without the user's instruction.

## Regression evidence and outstanding checks

- 30 automated tests pass and production web export passes (2,405 modules).
- Database policy/RPC/index checks confirmed with user-supplied results.
- Current analytics browser verification is blocked by the closed browser-control connection.
- Real network recovery, current provider flow/account switching, physical device, and simultaneous-session approval remain unverified.
- Shared database or teammate fixes require separate approval if a reproduced failure points outside src/trade.
