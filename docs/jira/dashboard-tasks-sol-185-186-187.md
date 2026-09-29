# Dashboard Tasks: SOL-185, SOL-186, SOL-187
## Jira Task Descriptions & Specifications

**Associated Jira Tasks:** SOL-185, SOL-186, SOL-187  
**Module:** Dashboard & Analytics  
**Status:** In Progress  

---

### SOL-185: Dashboard Widget Customization & Reordering UI

#### Summary
Design and implement an interactive customization interface allowing users to reorder dashboard widgets and toggle visibility of optional cards, backed by persistent local storage (`AsyncStorage`).

#### User Story
**As a** Solar Co-op mobile application user,  
**I want** to customize my Home Dashboard by reordering widget cards and toggling visibility for specific metrics,  
**So that** I can personalize my energy monitoring view around the metrics and controls that matter most to me (e.g., prioritizing battery storage, environmental impact, or peer sharing actions).

#### Scope & Implementation
- **Customization Mode / Modal**:
  - Accessible via a header action button (`SlidersHorizontal` / `LayoutGrid` icon) on `HomeDashboard.js`.
  - Presents a modal/sheet with all configurable dashboard cards.
- **Configurable Widgets**:
  - *Current Power Grid* (Solar, Grid, Home, Battery) [Core / Locked]
  - *Battery Storage & Real-Time Flow Card*
  - *Environmental Impact & Sustainability Scorecards* (CO₂ avoided, trees planted)
  - *Quick P2P Sharing & Borrowing Actions*
  - *Connected Smart Appliance Active Loads*
- **Reordering & Visibility Controls**:
  - Vertical drag handles or reordering arrows (Move Up / Move Down).
  - Toggle switches (`Switch`) to show or hide optional widgets.
- **Persistence & Fallback**:
  - Stores user layout preferences in `AsyncStorage` under `@solarcoop_widget_layout_v1`.
  - Provides a "Reset to Default Layout" option to restore standard view order.
- **State Integration**:
  - Exposes layout config and reorder handlers through `EnergyContext` or dashboard view state to avoid unnecessary child re-renders.

#### Acceptance Criteria
- [ ] User can open the Widget Customization modal from the Home Dashboard header.
- [ ] User can toggle visibility of non-mandatory widgets on and off.
- [ ] User can rearrange the display order of dashboard cards.
- [ ] Dashboard layout immediately updates upon saving preferences.
- [ ] Custom layout preferences persist across app restarts via `AsyncStorage`.
- [ ] "Reset to Default" button restores default layout order and visibility instantly.

#### Technical Details
- **Component Layer:** `src/components/dashboard/HomeDashboard.js`, `src/components/dashboard/WidgetCustomizerModal.js`
- **State / Context:** `src/context/EnergyContext.js`
- **Storage Key:** `@solarcoop_widget_layout_v1`
- **Icons:** `SlidersHorizontal`, `GripVertical`, `Eye`, `EyeOff`, `RotateCcw` from `lucide-react-native`

---

### SOL-186: Dashboard Date-Range & Granularity Filter

#### Summary
Build customizable date-range filtering (Today, 7D, 30D, Custom) and data aggregation granularity options (hourly, daily, weekly) across dashboard analytics and charts.

#### User Story
**As a** Solar Co-op household member reviewing energy analytics,  
**I want** to select custom date ranges and adjust time granularity across the Charts and Energy History views,  
**So that** I can analyze historical production spikes, detect peak appliance consumption windows, and evaluate long-term seasonal solar efficiency trends.

#### Scope & Implementation
- **Date Range Selector**:
  - Preset filter bar: `Today`, `Yesterday`, `Last 7 Days`, `Last 30 Days`, and `Custom Range`.
  - Date picker modal for custom start and end date selection.
- **Adaptive Granularity Control**:
  - Granularity options: `Hourly` (1h), `6-Hour` (6h), `Daily` (1d), and `Weekly` (1w).
  - Dynamic constraints: Granularity automatically adjusts to prevent chart overcrowding (e.g., hourly view is disabled for multi-month queries).
- **Service & Query Layer (`src/services/energyService.js`)**:
  - Update `fetchChartData` and `fetchHistory` to accept `dateRange` and `granularity` query parameters.
- **Context Integration (`src/context/EnergyContext.js`)**:
  - Centralize `selectedDateRange` and `selectedGranularity` in `EnergyContext`.
  - Display skeleton shimmer placeholders during historical data queries.
  - Graceful fallback to offline mock datasets when network is unreachable.

#### Acceptance Criteria
- [ ] User can switch between preset date filters (`Today`, `7D`, `30D`, `Custom`) with immediate UI feedback.
- [ ] Charts dynamically re-aggregate time-series data without page reloads or rendering errors.
- [ ] Granularity dropdown adapts dynamically based on the selected time window.
- [ ] ChartsView and EnergyHistoryView update synchronously when a new date window is applied.
- [ ] Selected date range filter persists across sub-tab navigation during the active session.

#### Technical Details
- **Component Layer:** `src/components/dashboard/ChartsView.js`, `src/components/dashboard/DateRangeFilter.js`
- **Service Layer:** `src/services/energyService.js` (`fetchChartData`, `fetchHistory`)
- **Context Integration:** `src/context/EnergyContext.js` (`dateFilter`, `setDateFilter`, `granularity`, `setGranularity`)
- **Tables Involved:** `public.chart_data`, `public.energy_history`

---

### SOL-187: Live Real-Time Telemetry & Status Indicator Widget

#### Summary
Implement a real-time telemetry card with streaming connection status badges, heartbeat pulse animation, and last-synchronized timestamp.

#### User Story
**As a** solar system owner,  
**I want** a dedicated real-time telemetry status widget with active connection badges, inverter health status, and live synchronization heartbeat counters,  
**So that** I have immediate visibility into whether my live solar inverter data is streaming reliably and can detect communication drops before energy is wasted.

#### Scope & Implementation
- **Connection Status Badge System**:
  - 🟢 **Live Stream**: Connected via Supabase Realtime WebSocket channel.
  - 🟡 **Polling (30s)**: Polling interval active every 30 seconds.
  - 🔴 **Offline / Disconnected**: Device offline or server unreachable; serving cached local metrics.
- **Animated Pulse Beacon**:
  - Looping pulse dot animation (`Animated.loop`) visually reflecting live data stream health.
- **Heartbeat & Telemetry Details**:
  - Live relative timestamp ticker: `"Updated just now"` / `"Updated 8s ago"`, auto-updating every second.
  - Inverter telemetry snapshot: Inverter status (`Optimal`), grid sync frequency, and data latency.
- **Manual Refresh Action**:
  - Tap-to-refresh action button enabling users to trigger immediate metric re-hydration and connection retry.

#### Acceptance Criteria
- [ ] Real-time status badge correctly displays current connection mode (Live Stream, Polling, Offline).
- [ ] Pulsing beacon animation operates continuously while telemetry connection is healthy.
- [ ] Heartbeat counter displays accurate human-readable relative time updating every second.
- [ ] Tapping refresh triggers immediate metric reload and updates the synchronization timestamp.
- [ ] Gracefully handles offline transitions without throwing errors or interrupting dashboard view.

#### Technical Details
- **Component Layer:** `src/components/dashboard/HomeDashboard.js`, `src/components/dashboard/TelemetryStatusWidget.js`
- **Context Integration:** `src/context/EnergyContext.js` (`telemetryStatus`, `lastFetchedAt`, `refreshMetrics`)
- **Animations:** `Animated.loop` with sequence scaling/opacity on `pulseAnim`
