# Epic 6: Dashboard Backend Implementation (SOL-151)
## Jira Task Descriptions & Specifications

**Epic Key:** SOL-151  
**Epic Name:** Epic 6 — Dashboard Backend Implementation  
**Associated Jira Tasks:** SOL-152, SOL-153  
**Status:** Done  

---

### SOL-152: Dashboard tab Backend

#### Summary
Design and implement the Supabase database schema, Row-Level Security (RLS), and RESTful client service integration for real-time household energy telemetry, active loads, and transaction logs.

#### User Story
As a Solar Co-op mobile application,
I need a robust, real-time backend persistence layer for live energy metrics, connected appliances, and peer-to-peer energy actions,
So that members receive authenticated, synchronized telemetry on the Home Dashboard and can reliably persist solar transactions with graceful offline fallback.

#### Scope & Backend Architecture
- **Supabase Database Schema (`energy_metrics`)**:
  - Created `public.energy_metrics` table with unique constraint on `user_id` (foreign key to `auth.users`).
  - Stores live operational metrics: `instant_production`, `daily_production`, `instant_consumption`, `daily_consumption`, `battery_level`, `battery_capacity`, `battery_power_flow`, `surplus_available`, `coop_pool_shared_today`, `coop_tokens_earned`, `monetary_saved`, `co2_saved_kg`, `grid_independence`, `coop_members_online`, and `coop_total_capacity`.
- **Row-Level Security (RLS)**:
  - Enabled RLS on `energy_metrics`, `energy_history`, and `appliances`.
  - Defined strict security policies (`USING (user_id = auth.uid())`) ensuring members can only read and mutate their own energy records.
- **Service Layer (`src/services/energyService.js`)**:
  - `fetchMetrics(userId)`: Reads snapshot from `energy_metrics`.
  - `upsertMetrics(userId, patch)`: Atomically updates metrics on user action or telemetry refresh.
  - `postShareEnergy(userId, amountKwh, recipient)`: Inserts surplus transaction log and increments community pool & token totals.
  - `postBorrowEnergy(userId, amountKwh)`: Inserts settled deficit transaction log.
  - `fetchAppliances(userId)` & `updateAppliance(applianceId, active)`: Fetches connected smart appliances and toggles remote states.
- **Context & Lifecycle Integration (`src/context/EnergyContext.js`)**:
  - Snake_case to camelCase data transformation mapping layer.
  - Parallel initial data hydration using `Promise.all`.
  - Background live polling: automatic 30-second interval telemetry refresh (`setInterval(refreshMetrics, 30_000)`).
  - Resilient offline fallback: Catches network/API exceptions and serves local default data to prevent UI disruptions.

#### Acceptance Criteria
- [x] Database table `energy_metrics` created with proper column constraints and foreign keys.
- [x] RLS policies applied and verified so users cannot access another member's telemetry.
- [x] Client service methods handle CRUD operations and throw errors for proper error boundary handling.
- [x] Background polling automatically fetches fresh metrics every 30 seconds for authenticated sessions.
- [x] P2P share/borrow calls atomically log to `energy_history` and update metrics balances.
- [x] Graceful fallback to offline mock data when Supabase connection is unreachable.

#### Technical Details
- **Migration File:** `supabase/migrations/001_energy_tables.sql`
- **Service Module:** `src/services/energyService.js`
- **Context Integration:** `src/context/EnergyContext.js`
- **Tables Involved:** `public.energy_metrics`, `public.energy_history`, `public.appliances`

---

### SOL-153: Charts tab Backend

#### Summary
Implement the time-series storage, multi-range retrieval service, and state caching for the interactive energy charts visualization across Day, Week, and Month intervals.

#### User Story
As a Solar Co-op user reviewing energy analytics,
I need the Charts tab to query pre-aggregated historical production and consumption datasets across multiple time ranges (Day, Week, Month) from Supabase,
So that I can smoothly inspect historical power generation, demand curves, and net surplus/deficit deltas without latency.

#### Scope & Backend Architecture
- **Supabase Database Schema (`chart_data`)**:
  - Created `public.chart_data` table storing time-series array datasets.
  - Columns: `id`, `user_id` (FK to `auth.users`), `range` (`text`: `'day'`, `'week'`, `'month'`), `hours` (`text[]`), `production` (`numeric[]`), `consumption` (`numeric[]`), `surplus` (`numeric[]`), `deficit` (`numeric[]`), and `updated_at`.
  - Composite unique constraint: `UNIQUE (user_id, range)` to ensure exactly one cache record per range per member.
- **Row-Level Security (RLS)**:
  - Enabled RLS on `chart_data` with policy `chart_data_member_own` restricting queries to `auth.uid() = user_id`.
- **Idempotent Seed Migration**:
  - Seeded realistic production and consumption curves for Day (hourly: 06:00 – 20:00), Week (Mon – Sun), and Month (W1 – W4).
- **Service Layer (`src/services/energyService.js`)**:
  - `fetchChartData(userId, range)`: Performs range-scoped query (`.eq('user_id', userId).eq('range', range).maybeSingle()`).
- **Context & UI Integration (`src/context/EnergyContext.js` & `ChartsView.js`)**:
  - Implemented `loadChartData(range)` callback triggered on tab selection change ('day' | 'week' | 'month').
  - Array type coercion to guarantee numeric arrays (`Number(v)`) for SVG coordinate calculations and avoid NaN chart rendering errors.
  - Fallback cache to `mockChartDataByRange` when offline or during cold start.

#### Acceptance Criteria
- [x] Database table `chart_data` created with array columns (`text[]`, `numeric[]`) and composite constraint.
- [x] RLS policies prevent unauthorized access across household accounts.
- [x] Seed scripts populate standard baseline curves for Day, Week, and Month ranges.
- [x] `fetchChartData` successfully retrieves range-specific datasets.
- [x] Switching time intervals in the mobile UI fetches and plots the corresponding dataset dynamically.
- [x] Fallback mechanism prevents chart rendering errors when network connection is unavailable.

#### Technical Details
- **Migration File:** `supabase/migrations/001_energy_tables.sql`
- **Service Module:** `src/services/energyService.js` (`fetchChartData`)
- **Context Integration:** `src/context/EnergyContext.js` (`loadChartData`, `mapChartRow`)
- **Consumer Component:** `src/components/dashboard/ChartsView.js`
- **Tables Involved:** `public.chart_data`
