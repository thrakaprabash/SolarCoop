# SolarCoop — Features & Workflows Guide

_How the app works today, for anyone new to the project. Built from the graphify knowledge graph (`graphify-out/graph.json`), the Supabase migrations and the project docs (2026-10-07)._

---

## 1. The app in one picture

```
                         ┌────────────── Supabase (Postgres + Auth + Realtime + Storage) ──────────────┐
                         │ profiles · energy_metrics · chart_data · energy_history · energy_records    │
                         │ trade requests · transactions · alerts · complaints · jobs · repair photos   │
                         │ RLS policies + RPCs (trade_approve_request, complete_job_ticket, …)          │
                         │ Triggers (complaint → job, complaint → alert, reversal → alert, closure)     │
                         └──────────────────────────────▲─────────────────────────────────────────────┘
                                                        │ src/lib/supabase.js
 App.js ─ AuthGate ─ RoleRouter ──┬── MemberApp      (Consumer / Solar Owner)  → Dashboard · Energy/P2P · Alerts · Profile
   (AuthContext / useAuth)        ├── AdminApp       (Admin)                   → Dashboard · Members · Transactions · Alerts · Complaints
                                  ├── TechnicianPortal (Technician)            → Jobs · Diagnostics · Repair · Close
                                  └── PendingApprovalLock (Solar Owner not yet approved)
```

**Tech stack:** React Native and Expo SDK 57 (Android, iOS and web), Supabase, i18next (English, Sinhala, Tamil), `expo-image-picker` for repair photos, `react-native-svg` for charts, and `node:test` with PGlite for tests.

---

## 2. Users & roles

| Role | How they get access | Lands in |
|---|---|---|
| **Consumer** | Self-registers and is active at once | MemberApp |
| **Solar Owner** | Self-registers with solar capacity. Status is `pending_approval` until an Admin approves | PendingApprovalLock → MemberApp |
| **Technician** | Self-registers and is active at once | TechnicianPortal |
| **Admin** | Not selectable at sign-up. Set up through admin-created accounts (SOL-159) or directly in the DB | AdminApp |

The status rules live in `STATUS_BY_ROLE` (`src/context/AuthContext.js:64`).

---

## 3. Feature workflows

### 3.1 Sign-up, login & member approval
1. **Register** (`RegistrationScreen`). The user picks Consumer, Solar Owner or Technician and enters their details (Solar Owners also enter capacity in kW). `AuthContext` creates the Supabase Auth user and a `profiles` row. `resolveRegistrationStatus()` sets the starting status.
2. **Login** (`LoginScreen`). Email and password through Supabase Auth. With *Remember me* on, the session is kept in AsyncStorage (`AUTH_STORAGE_KEY`, `REMEMBER_ME_KEY`).
3. **Forgot password** (`ForgotPasswordScreen`) sends a Supabase reset email.
4. **Routing.** `AuthGate` waits for the session, then `RoleRouter` sends the user to their portal. A Solar Owner in `pending_approval` sees `PendingApprovalLock`.
5. **Admin approval** (Admin → Members → `MemberDetailScreen`). `adminMemberService.updateMemberStatus()` moves a member between Pending, Active and Suspended. An admin can also create accounts (SOL-159).
6. **Logout** shows a confirmation, then clears the session and local storage.
7. **Profile** (`ProfileScreen`). The user edits their details and switches language (`LanguageSwitcher`).

### 3.2 Energy dashboard (members)
**Data flow:** `EnergyProvider` (`src/context/EnergyContext.js`) → `energyService` → Supabase tables `energy_metrics`, `chart_data` and `energy_history`.

- On login, `EnergyProvider` loads the data with `fetchMetrics()`, `fetchChartData()`, `fetchHistory()` and `fetchAppliances()`. It then refreshes every **30 seconds**.
- If Supabase can't be reached, it falls back to **offline mock data** so the screens never go blank.
- **Tabs** (`CachedDashboardContainer`, memoized so tabs keep their state when you switch):

| Tab | Shows |
|---|---|
| **Home** (`HomeDashboard`) | Today's summary and widgets: production, consumption, surplus or deficit, live status |
| **Production** | Solar output and system status |
| **Consumption** | Household usage and appliances |
| **Surplus / Deficit** | Energy available to share, or energy you are short |
| **History** | Past daily records |
| **Charts** (`ChartsView`) | Trend charts with a **Date-Range & Granularity filter** (`DateRangeFilter`) |
| **Summary** (`EnergySummaryView`) | Energy summary card with **Share/Export** (`ShareImpactModal`) |

- **Personalization** (Epic 8). `WidgetCustomizerModal` lets users show, hide and reorder Home widgets. The choice is saved in `EnergyContext`. `LiveTelemetryWidget` shows a live or stale status indicator.

### 3.3 P2P energy trading (Energy / P2P tab, `src/trade`)
**Lifecycle of a trade request:**
```
 Consumer                          Solar Owner (provider)                  Database
 ────────                          ──────────────────────                  ────────
 Available Energy screen  ──►  sees providers + available kWh   (RPC trade_available_providers / available_kwh)
 Energy Request screen    ──►  request created  ─────────────────────────►  status = PENDING
                               Incoming Requests → Request Approval
                                  ├─ Approve  (RPC trade_approve_request) ─►  APPROVED → COMPLETED + transaction row (COMPLETED)
                                  └─ Reject   (RPC trade_reject_request)  ─►  REJECTED
 My Requests              ◄──  sees status update
 Transaction Details / History ◄── transaction (grouped by month)
 Admin can later REVERSE a transaction ──► transaction status = REVERSED → trigger raises an alert
```
- **Screens:** `TradeScreen` (feature menu), `AvailableEnergyScreen`, `EnergyRequestScreen`, `MyRequestsScreen`, `IncomingRequestsScreen`, `RequestApprovalScreen`, `TransactionDetailsScreen` and `TransactionHistoryScreen`.
- **State:** `TradeContext` handles loading and refreshing through `requestService` (`fetchMyRequests`, `fetchIncomingRequests`, `approveRequest`, `rejectRequest`) and `transactionService`.
- **Safety:** Approval and rejection go through guarded server functions (RPCs) in `0006_trade_approval.sql`. A unique index allows only one transaction per request, so the same request can't be approved twice. Row-level security (RLS) means members only see their own requests.
- Inside the trade module, `NavigationContext` and `TradeShell` provide back navigation between the trade screens.

### 3.4 Smart Energy Insights & Sustainability Impact
- `energyAnalyticsService` reads raw `energy_records`. `dailyEnergyReadings` turns them into **one reading per Asia/Colombo day** (the latest one that day). `energyAnalytics.calculateDailyAnalytics()` then works out daily production, consumption, shared kWh and the comparison with the previous day.
- **Insights screen:** usage tips and trends (`InsightCard`).
- **Impact screen:** CO₂ saved, community contribution and SDG cards (`ImpactStatCard`, `SdgCard`).
- Text for both screens is localized in EN, SI and TA (`analyticsText.js`).

### 3.5 Complaints
1. A member submits a complaint (`SubmitComplaintScreen` → `complaintService.submitComplaint()`). The complaint starts as `open`.
2. The member can **edit or delete it only while it is `open`**.
3. An Admin reviews it in `ComplaintsScreen` and moves it through the status stepper:
   `Open → Under Review → Investigated → Resolved` or `Rejected`, with a resolution note.
4. A database trigger (`trg_complaint_alert`) also raises an admin alert for each new complaint.
5. **If the complaint type is "System Fault",** a second trigger creates a **technician job** automatically (see 3.7).

### 3.6 Alerts (admin + members)
Alerts come from three sources:

| Source | How |
|---|---|
| **Manual** | Admin creates, edits or resolves alerts in `AlertsScreen` (`AlertFormModal` → `adminAlertService.createAlert/updateAlert`) |
| **Event triggers (DB)** | A complaint is created, or a transaction is reversed → alert inserted automatically (`0004_event_alerts.sql`) |
| **System scan** | Admin runs a scan → `alertScanService.scanForSystemAlerts()` loads members, readings, transactions, pending requests and open complaints, then runs the `alertRules` checks |

**Scan rules** (`src/admin/services/alertRules.js`): abnormal member energy, low or high community energy, stale meter data, large transactions, requests pending too long, sign-ups pending too long, and complaints that have stayed open too long. Each check skips problems that already have an alert (`shouldRaise`). A scan never raises the same alert twice.

- **Severity:** low, medium, high or critical. **Status:** active, resolved or dismissed.
- Members see their alerts and complaints together in the **Alerts Hub** (`AlertsHubScreen`). System alerts can't be deleted by members (SOL-172).

### 3.7 Technician portal & fault recovery (Epic 9)
**Job lifecycle:**
```
 Fault reported (complaint type "System Fault")
        │  trigger raise_job_from_complaint
        ▼
 jobs row  status = pending   (client name/phone snapshot, error message, urgency, calm consumer message)
        │  realtime (0007) → appears on the Technician's Job Dashboard
        ▼
 Technician: Accept Job  (jobService.acceptJob)                → status = active
        │  Diagnostics dossier (household history, error details)
        │  Navigate via Google Maps (utils/maps.js)
        │  Repair: tick checklist (toggle_job_checklist_item) + notes (save_job_resolution_notes)
        │          upload photo evidence (expo-image-picker → Storage → attach_job_repair_photo)
        ▼
 Close Job  (complete_job_ticket)  → status = completed; trigger record_job_closure stamps closure record
```
- **Member side:** `faultAlertService` subscribes to the member's fault alerts in real time. The member gets a calm, jargon-free message saying a technician is coming, and can see **which technician is assigned**. The member is told through an alert and through the job status, which is the "dual-channel alert engine" (SOL-201).
- **Offline-safe:** `jobMutationQueue` queues accept, checklist, notes and close actions when the network drops and replays them in order later (covered by `tests/job-mutation-queue.test.cjs`).
- **Screens:** `TechnicianDashboardScreen` (Pending / Active / Completed tabs), `JobTicketDetailScreen`, `DiagnosticsScreen` and `JobClosureScreen`. A `CriticalAlertCard` highlights urgent faults.

### 3.8 Admin portal
| Screen | What it does |
|---|---|
| **Dashboard** (`AdminDashboardScreen`) | Community stats (`computeCommunityStats`), system health panel, activity feed |
| **Members** (`MemberMonitoringScreen`, `MemberDetailScreen`) | List and filter members, approve or suspend, see each member's transactions, create accounts |
| **Transactions** (`TransactionMonitoringScreen`) | Every P2P transaction. The admin can **reverse** one, which raises an alert |
| **Alerts** (`AlertsScreen`) | Alert CRUD and running the system scan |
| **Complaints** (`ComplaintsScreen`) | Review and resolve complaints through the status stepper |
| **Settings / Profile** (`AdminSettingsScreen`) | Edit admin details, switch language |

Admin-only data access is enforced with the `is_admin()` RLS function (`0002_alerts_and_admin_rls.sql`).

### 3.9 Multi-language
- The app is fully translated into **English, Sinhala and Tamil** (`src/i18n/locales/en|si|ta.json`).
- On first launch it picks the device language (`expo-localization`). The user can switch it later from Profile (`setAppLanguage`).
- Dates and numbers are formatted centrally, so kWh and dates look right in each language.

---

## 4. Status cheat-sheet

| Thing | Statuses |
|---|---|
| Member profile | `pending_approval` → `active` / `suspended` |
| Trade request | `PENDING` → `APPROVED` → `COMPLETED` · or `REJECTED` |
| Transaction | `COMPLETED` → `REVERSED` (admin) |
| Complaint | `open` → `under_review` → `investigated` → `resolved` / `rejected` |
| Alert | `active` → `resolved` / `dismissed` · severity low/medium/high/critical |
| Technician job | `pending` → `active` → `completed` |

---

## 5. How to run & test
```bash
npm install          # note: lockfile install currently hits a registry 403 (see PROJECT_REPORT.md)
npm start            # Expo dev server (a = Android, i = iOS, w = web)
npm test             # runs tests/*.test.cjs only (trade suites under src/ must be run separately)
```
Supabase migrations are in `supabase/migrations/`. Apply them in order. Note that **two files share the prefix `0006`**. Demo technician jobs are seeded with `technician_demo_jobs.sql` (in `supabase/`).

---

## 6. Things to know (current limitations)
- **"Report an issue"** on Transaction Details only shows a toast. It does not create a complaint yet.
- **Technicians self-register as active with no approval,** and they can see household names and phone numbers. Consider requiring admin approval, as Solar Owners already have.
- Daily analytics use a team convention ("latest reading per Colombo day") that the data owner hasn't confirmed. Synthetic readings (IDs 10–18) are still in the database.
- In Tamil, the bottom-navigation labels are crowded.

See `docs/PROJECT_REPORT.md` for the full Jira-vs-code comparison.
