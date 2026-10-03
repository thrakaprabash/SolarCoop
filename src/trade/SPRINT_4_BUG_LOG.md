# Sprint 4 component bug log

Updated: 4 October 2026. Scope: src/trade.

| Finding | Evidence | Resolution/status |
| --- | --- | --- |
| Changing between Energy/P2P retains the prior route | Same TradeModule instance; NavigationProvider's initial useState does not rerun on entry prop change | Fixed under SOL-179, `6bad010`. Browser checked both directions; evidence `f9dc4e5`. |
| Analytics show seeded figures and a fixed Menuka greeting | Observed in the signed-in test account during navigation checks | Sample exports/context removed in `9efd7b2` (SOL-182/SOL-183). Real scoped reads and appropriate unavailable states implemented; latest UI check pending. |
| Daily energy aggregation semantics initially unknown | Only one August reading; no producer establishes daily/interval/counter meaning | On 4 October the user adopted latest reading per Colombo day as accumulated daily kWh. Adapter and screens connected within src/trade; current missing-period data remains unavailable. Positive-data live verification passed with approved synthetic requester readings; see the fixture manifest. |
| New analytics explanatory text is English | Component-local text initially added without shared locale changes | Component-local EN/SI/TA translations added; all 15 keys and substitutions checked. Existing translated tabs/headings preserved. Visual language switch/wording review pending. |
| Tamil coverage label exceeds Impact card width | Direct narrow-browser rendering; inner row not constrained to card content width | SOL-180: constrain nested row width to 100%; refreshed browser confirmed wrapping. Final screenshot in evidence/sprint4/tamil-impact-lower.jpg. |
| Tamil shared bottom-navigation labels are crowded | Visible during the same narrow-browser checks | Teammate/shared code. Recorded for coordination; no edit made. |
| History refresh displays raw fetch error and leaves old totals unlabelled | User offline screenshot, evidence/sprint4/history-offline-before.png | SOL-180: component-local EN/SI/TA retry message and previously-loaded-history label added, including successfully loaded empty history. Retry disabled during an active refresh. 40 tests and web export pass; user reported updated History/Insights offline checks work; direct browser recovery checks passed and screenshots saved. No updated offline screenshot was supplied. |

The SOL-180 Impact card-width fix is component-local. Do not create a Jira Bug or change Jira status from this log without the user's instruction.

## Regression evidence and outstanding checks

- 40 automated tests pass and production web export passes (2,406 modules).
- Database policy/RPC/index checks confirmed with user-supplied results.
- Browser control reconnected; analytics language, provider/requester, routing, and recovery checks are recorded in the evidence README.
- Impact outage/recovery has screenshot evidence. Updated History/Insights offline checks were reported successful by the user; their recovery was checked directly. Physical device and simultaneous-session approval remain unverified; demo uses the browser.
- Shared database or teammate fixes require separate approval if a reproduced failure points outside src/trade.
