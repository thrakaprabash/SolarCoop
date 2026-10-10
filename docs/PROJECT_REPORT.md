# SolarCoop — Project Report (Codebase + Jira)

_Generated 2026-10-07 from the graphify knowledge graph (`graphify-out/`) and the Jira project **SOL** (tharaka-prabash.atlassian.net). Individual source files were not read one by one._

---

## 1. What SolarCoop is

SolarCoop is a **mobile app for a community solar energy co-operative**. It is built with React Native and Expo SDK 57 and uses Supabase (Postgres, Auth, Realtime, Storage) as its backend. Households with solar panels share their extra energy with neighbours. Everyone can watch their own energy use, and the co-op's admins and technicians run the community from the same app.

**Four user roles** (Jira SOL-94, `role-access-matrix.md`):

| Role | What they do in the app |
|---|---|
| **Solar Owner / Prosumer** | Watches production and surplus, and sells surplus energy to neighbours (P2P) |
| **Consumer** | Watches consumption, requests energy from the community pool, and files complaints |
| **Admin** | Approves members, monitors transactions, manages alerts, and resolves complaints |
| **Technician** | Receives fault job tickets, navigates to the site, repairs, uploads evidence, and closes the job |

`App.js` sends each signed-in user to one of three portals based on their role: **MemberApp**, **AdminApp** or **TechnicianPortal**.

---

## 2. Architecture at a glance (from the graph)

The graph has **971 nodes, 2,147 edges and 70 communities**. It was built from 183 code files and 21 docs. The 44 images were skipped to save tokens.

```
App.js (role router) ── AuthContext / useAuth()  ← most-used bridge node in the graph
   ├── Member app ── EnergyContext → energyService → Supabase (energy_metrics, chart_data, energy_history)
   │                 └── Dashboard tabs: Home, Production, Consumption, Surplus, Deficit, History, Charts, Summary
   │                 └── P2P Trade module (src/trade) ── TradeContext → requestService / transactionService
   │                                                  └── energyAnalytics engine → Insights & Impact screens
   ├── Admin portal (src/admin) ── AdminContext → adminMemberService / adminTransactionService / adminAlertService
   │                              └── alertRules engine + alertScanService (automatic system alerts)
   └── Technician portal (src/technician) ── TechnicianContext → jobService / repairPhotoService (+ offline mutation queue)
Shared: src/lib/supabase.js, src/i18n (EN / SI / TA), src/theme (COLORS, GLASS), src/trade/theme (colors, weight)
```

**God nodes** (the most-connected abstractions): `colors`, `weight`, `useAuth()`, `COLORS`, `useEnergy()`, `GLASS`, `kwh()`, `useAdmin()`, `useNavigation()`, `useTheme()`.

**Database migrations** (`supabase/migrations`): energy tables, trade schema, trade approval RPCs, alerts and admin RLS, event alerts and alert scanning, technician jobs, jobs realtime, repair photos, repair drafts and job closure records.

---

## 3. Features in the codebase (by graph community)

| Area | What it does | Key code |
|---|---|---|
| **Auth & members** | Registration with role-based status (Admins approve new members), login with remember-me, forgot password, logout confirmation, profile, and a pending-approval lock | `AuthContext.js`, `LoginScreen`, `RegistrationScreen`, `ForgotPasswordScreen`, `ProfileScreen` |
| **Energy dashboard** | Home dashboard with tabs for Production, Consumption, Surplus, Deficit, History, Charts and Summary. The dashboard refreshes every 30 seconds and falls back to offline mock data when it can't reach Supabase | `EnergyContext`, `energyService`, `src/components/dashboard/*` |
| **Dashboard personalization** | Widget customization and reordering, a date-range and granularity filter, a live telemetry widget, share/export of the energy summary, and memoized cached tabs | `WidgetCustomizerModal`, `DateRangeFilter`, `LiveTelemetryWidget`, `ShareImpactModal`, `CachedDashboardContainer` |
| **P2P energy trading** | Browse the community energy pool, submit energy requests, track my requests, approve or reject incoming requests, view transaction details and history (grouped by month) | `src/trade/*`, `TradeContext`, `requestService`, `transactionService`, migration `0006_trade_approval.sql` |
| **Analytics** | Smart Energy Insights and Sustainability Impact (CO₂ and SDG cards). Daily figures are calculated from the latest reading of each Asia/Colombo day | `energyAnalytics.js`, `energyAnalyticsService`, `useEnergyAnalytics` |
| **Admin** | Dashboard and activity feed, member monitoring and detail, admin-created accounts, transaction monitoring and reversal, alert management (CRUD), complaints review and a resolution stepper | `src/admin/*` |
| **Alerts engine** | Automatic system alerts from these rule checks: member energy, community energy, data freshness and large transactions | `alertRules.js`, `alertScanService.js`, `scripts/test-alert-rules.mjs` |
| **Complaints** | Members submit complaints, and an alerts hub shows complaints and alerts together | `complaintService`, `SubmitComplaintScreen`, `AlertsHubScreen` |
| **Technician portal** | Job dashboard. A fault automatically creates a job ticket, which the technician accepts. Also: a pre-visit diagnostic dossier, Google Maps navigation, critical alert view, repair photo evidence, checklist and notes, and closing the ticket. Includes an offline job-mutation queue and realtime job updates | `src/technician/*`, migrations `0006_technician_jobs`–`0010` |
| **Multi-language** | English, Sinhala and Tamil through i18next, a language switcher, and centralized date and number formatting | `src/i18n`, `LanguageSwitcher.js` |
| **Tests** | `node:test` suites for technician DB (PGlite), repair photos, the job queue, trade services, analytics and utils | `tests/*.test.cjs`, `src/trade/**/*.test.cjs` |

---

## 4. Jira — Epics and their features

**Totals:** 10 epics and 111 issues. **All of them are Done (0 open).**
_Note: Jira didn't return each story's parent link, so the story-to-epic grouping below is inferred from issue keys and summaries._

| Epic | Owner | Stories / tasks (all Done) |
|---|---|---|
| **SOL-124 Epic 0 – Project Research** | — | Project charter, Jira, backlog, Scrum roles, GitHub repo, Expo project, DB design, wireframes, navigation design, DoD, Sprint 1 backlog, Sprint 2 review (SOL-47…57, 132–135, 138) |
| **SOL-8 Epic 1 – Auth & Member Management** | Irusha Shaveen | Registration, login and logout UI, profile/settings, role-based navigation (SOL-90…95). Supabase setup, theme and auth kit, registration and login backend, password recovery, logout cleanup, profile dashboard (SOL-139…145) |
| **SOL-9 Epic 2 – Energy Dashboard & Analytics** | Tharaka Prabash | UI for Home, Production, Consumption, Surplus, Deficit, History, Charts and Energy Summary (SOL-96…103) |
| **SOL-10 Epic 3 – Energy Sharing & Transactions** | Pawan Menuka | UI for Available Energy, Requests, My Requests, Approve/Reject, Transactions, History, Insights and Impact (SOL-104…109, 136, 137). Backend for available energy and submit request (SOL-149, 150). Approval, details, history, my requests, P2P integration, bug fixes, demo, Insights and Impact (SOL-175…183) |
| **SOL-11 Epic 4 – Administration, Alerts & Complaints** | Vihanga Perera | UI for Admin dashboard, member and transaction monitoring, alerts and complaints (SOL-110…116). Member monitoring and complaints backend, admin profile (SOL-146…148). Alerts schema, real transactions, alert management, status-mapping fix, admin-created accounts, complaints polish (SOL-155…160) |
| **SOL-12 Epic 5 – Integration, Testing & Finalization** | Vihanga Perera | Navigation, role and feature integration, system testing, bug fixes, Sprint 2 demo and build (SOL-117…123). Sprint 3 testing and fixes (SOL-161, 162). Sprint 4 bug fixes, demo data, final mobile build (SOL-172…174) |
| **SOL-151 Epic 6 – Dashboard Backend** | Tharaka Prabash | Dashboard tab backend (SOL-152), charts tab backend (SOL-153) |
| **SOL-154 Epic 7 – Multi-language (i18n)** | Vihanga Perera | i18n architecture, string extraction ×3, Sinhala and Tamil translation passes, language switcher, date/number formatting, regression testing (SOL-163…171) |
| **SOL-184 Epic 8 – Dashboard Personalization & Real-Time** | Tharaka Prabash | Widget customization and reordering, date-range filter, live telemetry widget, summary export and sharing, tab caching (SOL-185…189) |
| **SOL-191 Epic 9 – Technician Portal & Fault Recovery** | Irusha Shaveen | Job dashboard, auto fault-to-ticket dispatch, diagnostic dossier, Google Maps, accept job, critical alert view, calm fault notification, see assigned technician, dual-channel alerts, repair photos, checklist, close ticket (SOL-193…204) |

---

## 5. Jira vs. codebase comparison

### Where the code matches Jira ✅
Every epic has matching code in the graph. Auth → `AuthContext` and the auth screens. Dashboard → `src/components/dashboard`. P2P → `src/trade`. Admin and alerts → `src/admin`. i18n → `src/i18n` (EN/SI/TA). Personalization → `WidgetCustomizerModal`, `DateRangeFilter`, `LiveTelemetryWidget`, `ShareImpactModal`, `CachedDashboardContainer`. Technician → `src/technician` plus migrations 0006–0010. **No epic is missing from the code.**

### What is wrong or inconsistent ⚠️

| # | Issue | Evidence | Severity |
|---|---|---|---|
| 1 | **"Report an issue" button is a stub.** It only shows a toast and never creates a complaint. Jira has complaint stories marked Done, but this entry point was never wired up. | `src/trade/screens/TransactionDetailsScreen.js:145`; `IMPLEMENTATION_HANDOFF.md:86` | Medium |
| 2 | **`npm test` skips most test suites.** The script runs only `tests/*.test.cjs` (3 files). About 10 trade and analytics suites under `src/trade/**` never run, so "System Testing" being Done is weaker than it looks. | `package.json:36` | Medium |
| 3 | **Doc status disagrees with Jira.** `docs/jira/dashboard-tasks-sol-185-186-187.md` still says **"Status: In Progress"** with unticked acceptance criteria. Jira says Done, and the code exists. | `dashboard-tasks-sol-185-186-187.md:6` | Low (docs) |
| 4 | **Sprint 4 checklists are still unticked.** The final acceptance checklist in `SPRINT_4_IMPLEMENTATION_PLAN.md` and the SOL-179 integration checks are unticked. Native-device checks, the simultaneous-approval test and the demo video recording are listed as pending, yet SOL-179/181 are Done. | `src/trade/SPRINT_4_*.md` | Medium |
| 5 | **Open bug: Tamil labels crowd the bottom navigation.** It is logged in the Sprint 4 bug log but has no Jira ticket (SOL-172 is closed). | `SPRINT_4_BUG_LOG.md` | Low |
| 6 | **Two migrations share the number `0006`** (`0006_technician_jobs.sql`, `0006_trade_approval.sql`). A third uses a different naming style (`001_energy_tables.sql`). This can cause ordering conflicts with the Supabase CLI. The trade migration was also never applied to a clean test database (Sprint 4 docs). | `supabase/migrations/` | Medium |
| 7 | **Production screens import from a mock file.** Six admin and alert screens import `timeAgo` from `admin/data/mockAdminData.js`. It works, but a utility living in mock data is fragile, and mock admin data still ships in the app. | `AdminDashboardScreen.js:12` etc. | Low |
| 8 | **Synthetic test readings (IDs 10–18) are still in the energy DB**, and the meaning of the daily aggregation was never confirmed by the data owner. The "latest reading per Colombo day" rule is a team convention. | `SPRINT_4_DATA_CONTRACT.md`, `SPRINT_4_CALCULATION_RULES.md` | Medium (data accuracy) |
| 9 | **Sinhala and Tamil wording has not been reviewed by native speakers**, even though SOL-167/168/171 are Done. | Sprint 4 docs | Low |
| 10 | **A fresh install fails.** `npm install` from the lockfile hits a registry 403, so dependencies were copied from a Sprint 3 worktree. A new teammate may not be able to build. | Sprint 4 handoff | Medium |
| 11 | **Cross-module theme coupling.** Admin components import `src/trade/theme/colors`, and a second global theme also exists in `src/theme/colors.js` (`COLORS`, `GLASS`). The app has two design systems. | graph edge `AdminBottomTabBar → trade/theme/colors` | Low (tech debt) |
| 12 | Jira hygiene: the parent links of the older stories weren't returned, two stories are duplicates (SOL-93 and SOL-95 are both "User Profile and Account Settings UI Design"), and Epic 0 has no assignee. | Jira | Low |

### Graph-quality notes (for transparency)
- 18 `.sql` files produced no AST nodes because `tree_sitter_sql` isn't installed. The schema was covered through the docs instead.
- The health check reported **513 dangling-endpoint edges**, mostly imports pointing to external packages. The graph is still usable.
- The weakest-connected (lowest-cohesion) communities are Technician Portal (0.06) and App Shell (0.07). These are candidates to split if the code keeps growing.

---

## 6. Recommended next steps
1. Wire "Report an issue" to `complaintService` and pre-fill it with the transaction ID.
2. Change the test script to `node --test "tests/*.test.cjs" "src/**/*.test.cjs"`.
3. Renumber the migrations (e.g. `0011_trade_approval.sql`) and test them on a clean database.
4. Update the stale doc statuses, tick the Sprint 4 checklists or open Jira tickets for what's still pending (Tamil nav overflow, device QA, demo video).
5. Remove the synthetic DB rows and move `timeAgo` into `src/utils`.
6. Fix the npm 403 (registry or auth config) so a clean install works.

_Explore further: open `graphify-out/graph.html`, or run `graphify query "<question>"`._
