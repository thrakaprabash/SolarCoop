# Epic 2: Energy Dashboard & Analytics (SOL-9)
## Jira Task Descriptions & Specifications

**Epic Key:** SOL-9  
**Epic Name:** Epic 2 — Energy DashBoard & Analytics  
**Associated Jira Tasks:** SOL-96, SOL-97, SOL-98, SOL-99, SOL-100, SOL-101, SOL-102, SOL-103  
**Status:** Done  

---

### SOL-96: Home DashBoard UI

#### Summary
Build the primary landing Home Dashboard screen providing live solar power telemetry, energy flow visualization, environmental gauges, and rapid peer-to-peer sharing actions.

#### User Story
As a Solar Co-op household member, I want an intuitive real-time dashboard displaying my current power generation, household consumption, battery status, and community activity so that I can monitor my energy balance at a glance.

#### Scope & UI Components
- **Live Telemetry Header**: Real-time pulsing status indicator (`Current Power - Live • Updated just now`) and expand trigger.
- **2×2 Interactive Power Grid**:
  - *Solar Generation*: Live kW generation with +12% trend indicator; tapping navigates to the Production tab.
  - *Grid Status*: Grid import status (kW / Offline); tapping navigates to the Deficit tab.
  - *Net Output / Draw*: Dynamic highlight card (amber for exporting surplus, red for importing deficit) showing net balance.
  - *Battery Storage*: Battery discharge rate and State of Charge (SoC %); tapping navigates to the Surplus tab.
- **Environmental Benefits Gauges**: Three circular SVG progress rings showing CO₂ saved (kg), sunshine peak percentage (%), and grid independence score (%).
- **Site Power vs. Energy Toggle**: Segmented pill switch to toggle between instant Power (`kW`) and cumulative daily Energy (`kWh`), updating the breakdown between solar and co-op generation.
- **Dynamic Energy Flow Diagram**: Visual node diagram (Solar → Home → Battery) illustrating real-time power distribution and direction.
- **Co-op Community Activity Strip**: Metrics for online co-op members, shared community pool capacity (kW), and earned tokens.
- **Quick Action Buttons**: "Share Surplus" (primary amber action) and "Request Draw" (secondary glass action) with an inline 3-second animated confirmation toast.
- **Loading Skeleton**: Shimmer skeleton blocks for smooth loading states on initial telemetry fetch.

#### Acceptance Criteria
- [x] Renders real-time power metrics derived from `EnergyContext`.
- [x] Tapping on Solar, Grid, and Battery cards seamlessly switches to their respective sub-views (`production`, `deficit`, `surplus`).
- [x] Toggling between "Power" and "Energy" updates both numerical values and unit labels (`kW` vs `kWh`).
- [x] Quick actions trigger `executeShareEnergy` and `executeBorrowEnergy` with immediate visual feedback via a confirmation toast.
- [x] Responsive layout with dark glassmorphic styling consistent with the design system.

#### Technical Details
- **Component**: `src/components/dashboard/HomeDashboard.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`, `setActiveTab`, `executeShareEnergy`, `executeBorrowEnergy`, `loading`)
- **Animations**: `Animated.loop` with pulse animation on native and web

---

### SOL-97: Production Tab UI

#### Summary
Implement the dedicated Solar Production tab showing live solar array generation, today's generation curve, weather telemetry, and string-level array health.

#### User Story
As a solar system owner, I want detailed visibility into my solar panel generation, environmental irradiance, and array efficiency so that I can verify that my solar installation is performing optimally.

#### Scope & UI Components
- **Header**: Story title badge for Solar Power Generation.
- **Hero Generation Banner**: Large amber sun gauge displaying live instant output (`instantProduction kW`) with daily total kWh, peak daily output, and system capacity utilization.
- **Today's Generation Curve (SVG Bar Chart)**: Hourly production curve from 06:00 to 18:00 highlighting the solar peak window (12:00) with dashed threshold gridlines.
- **Solar Telemetry Trio**: Three glassmorphic cards showing:
  - *Solar Irradiance* (W/m²)
  - *Panel Temperature* (°C)
  - *Inverter Efficiency* (%)
- **Solar Array Breakdown List**: Modular card listing strings (Roof North Array 12 panels, Roof South Array 10 panels, Carport Solar Canopy 4 panels) with rated capacity, current kW output, efficiency percentage, and status pill badges (`Optimal`, `Partial Shade`).

#### Acceptance Criteria
- [x] Displays instant generation and daily cumulative solar metrics.
- [x] Renders hourly solar generation curve using SVG elements.
- [x] Displays ambient irradiance, inverter efficiency, and panel temperature telemetry.
- [x] Displays string-level health badges and individual array production figures.

#### Technical Details
- **Component**: `src/components/dashboard/ProductionView.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`)
- **Libraries**: `react-native-svg` (`Rect`, `Path`, `Line`, `Text`)

---

### SOL-98: Consumption Tab UI

#### Summary
Build the Household Energy Load tab to monitor active electrical consumption, view AI load-shifting recommendations, and toggle individual connected appliances.

#### User Story
As a co-op household member, I want to track which appliances are consuming electricity in real time and receive smart recommendations so that I can shift heavy loads into peak solar hours and minimize grid draw.

#### Scope & UI Components
- **Active Load Demand Card**: Prominent card displaying live household load (`instantConsumption kW`), cumulative daily consumption (`kWh`), peak usage hour, and solar self-consumption coverage percentage.
- **Smart Solar Load Schedule Banner**: AI recommendation card advising the user to run high-load appliances (washer/dryer, water heater heat pump) during high-sun windows (12:00 PM – 3:00 PM) for 100% free solar power.
- **Connected Home Appliances List**: List of active and standby smart appliances (HVAC AC, Tesla Wallbox EV Charger, Smart Washer/Dryer, Water Heater, Refrigerator, Home IT/Entertainment) with category badges and power draw ratings.
- **Appliance Remote Toggles**: Interactive switch controls for each appliance with instant optimistic toggle updates and backend synchronization.

#### Acceptance Criteria
- [x] Accurately displays active load demand and peak usage telemetry.
- [x] Highlights peak solar scheduling recommendations with AI banner.
- [x] Lists all registered appliances with icons, categories, and power draws.
- [x] Toggling appliance switch calls `toggleAppliance(app.id)` and maintains state.

#### Technical Details
- **Component**: `src/components/dashboard/ConsumptionView.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`, `appliances`, `toggleAppliance`)
- **Icons**: Lucide icons (`Zap`, `Wind`, `Repeat`, `Droplet`, `Box`, `Tv`, `Sparkles`)

---

### SOL-99: Surplus Tab UI

#### Summary
Implement the Surplus Energy & Co-op Sharing tab to track battery storage levels, configure automated community pool exports, and execute direct peer-to-peer energy transfers.

#### User Story
As a solar prosumer with excess generation, I want to see my available surplus and battery charge state, and transfer energy directly to co-op neighbors or automated pools in exchange for co-op tokens.

#### Scope & UI Components
- **Surplus Rate Meter**: Hero card showing current surplus generation rate (`surplusAvailable kW`).
- **Battery State of Charge (SoC)**: Powerwall battery gauge with horizontal fill indicator, current percentage (`metrics.batteryLevel%`), and kWh reserve capacity.
- **Sharing Earnings Summary**: Cumulative energy shared today (`kWh`) and total co-op reward tokens earned (`pts`).
- **Direct P2P Energy Transfer Form**:
  - Numeric input field for transfer amount (`kWh`).
  - Destination input field for recipient household / co-op pool.
  - Action button: "Confirm & Transfer Surplus Energy".
  - Success banner confirming successful transfer.
- **Automated Co-op Pool Sharing Card**: Switch toggle allowing automatic surplus export when battery level exceeds the 75% threshold.

#### Acceptance Criteria
- [x] Displays surplus rate and visual battery percentage bar.
- [x] Form validates numeric kWh transfer amount and recipient name/ID.
- [x] Submitting transfer triggers `executeShareEnergy`, updates community totals, awards tokens, and shows inline confirmation.
- [x] Auto-share switch toggles setting via `setAutoShareEnabled`.

#### Technical Details
- **Component**: `src/components/dashboard/SurplusView.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`, `autoShareEnabled`, `setAutoShareEnabled`, `executeShareEnergy`)

---

### SOL-100: Deflict tab UI (Deficit & Grid Backup Tab UI)

#### Summary
Build the Deficit & Grid Backup tab to monitor power shortfalls, compare co-op rates against utility grid rates, and request emergency draws from the community reserve.

#### User Story
As a co-op member experiencing low solar output or high energy demand, I want to monitor any power deficit and borrow affordable clean power from the co-op reserve instead of paying expensive utility peak tariffs.

#### Scope & UI Components
- **Grid Import Deficit Card**: Red-accented alert card displaying live deficit status (`0.0 kW / Zero Deficit`).
- **Protection Banner**: Status message indicating whether home solar and battery capacity are currently avoiding grid draw.
- **Energy Rate Cost Comparison**: Side-by-side comparative cards:
  - *Co-op Peer Rate*: $0.20/kWh (Recommended clean energy from neighbors).
  - *Utility Main Grid Rate*: $0.45/kWh (Peak fossil grid demand price).
- **Emergency Co-op Draw Form**:
  - Numeric input field for energy amount to borrow (`kWh`).
  - Action button: "Execute Co-op Energy Borrow".
  - Animated inline confirmation banner upon successful transaction execution.

#### Acceptance Criteria
- [x] Clearly displays live deficit or zero-deficit self-sufficiency status.
- [x] Accurately displays rate comparison cards with unit pricing.
- [x] Form accepts numeric borrow amount and calls `executeBorrowEnergy`.
- [x] Appends a settled deficit record to the history log and shows success banner.

#### Technical Details
- **Component**: `src/components/dashboard/DeficitView.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`, `executeBorrowEnergy`)

---

### SOL-101: Energy History Tab UI

#### Summary
Implement the Energy History & Statements tab providing an audit log of energy transactions, search and category filtering, and certified statement export.

#### User Story
As a co-op member, I want to search and filter my historical energy events (generation, consumption, P2P sharing, deficit draws) and export monthly verified ledger statements for accounting and transparency.

#### Scope & UI Components
- **Statement Export Bar**: Card with download trigger button for verified monthly Co-op energy statement (PDF/CSV).
- **Export Modal**: Dialog presenting statement metadata (generation, trading, carbon offsets) with download confirmation animation.
- **Search & Filter Controls**:
  - Live search input filtering transaction title and details.
  - Horizontal filter pills: "All Events", "⚡ Surplus Shared", "☀️ Solar Gen", "🔋 Usage", "⚠️ Deficit Draw".
- **Chronological Timeline List**: Event items displaying event icon badge, title, timestamp, kWh magnitude, token/dollar value, and transaction detail.
- **Pagination**: "Load More" action button with loading spinner for infinite scroll pagination.

#### Acceptance Criteria
- [x] Displays chronological transaction log with event-type specific color coding and icons.
- [x] Search input filters transaction entries in real time.
- [x] Category pills filter list by transaction type (`all`, `surplus`, `production`, `consumption`, `deficit`).
- [x] Export modal opens and simulates statement PDF generation.
- [x] "Load More" triggers `loadMoreHistory` when additional records exist.

#### Technical Details
- **Component**: `src/components/dashboard/EnergyHistoryView.js`
- **State Hooks / Context**: `useEnergy()` (`historyLogs`, `loadMoreHistory`, `historyHasMore`, `loadingMore`)

---

### SOL-102: Charts Tab UI

#### Summary
Build the Interactive Energy Charts tab with dual-line curves comparing solar production and household consumption, interactive data point inspection, and net delta visualization.

#### User Story
As an energy-conscious member, I want interactive charts that visualize the balance between my solar generation and household load across Day, Week, and Month timeframes so that I can identify usage trends.

#### Scope & UI Components
- **Time Range Selector**: Range switcher tabs for Day, Week, and Month views.
- **Dual-Line SVG Chart**:
  - Amber line for solar generation.
  - Teal line for household load consumption.
  - Dynamic Y-axis scale calculated from max dataset value with horizontal dashed gridlines.
  - Interactive point markers on the curve.
- **Interactive Point Selector & Inspection Banner**:
  - Horizontal time pills strip to select any timestamp/point.
  - Inspection banner displaying the selected window, exact production (kW/kWh), exact consumption (kW/kWh), and net energy delta (+/- balance).
- **Net Energy Delta Bar Chart**: Bi-directional SVG bar chart displaying surplus bars (upward teal) vs deficit bars (downward red) against a center reference axis.

#### Acceptance Criteria
- [x] Renders SVG dual-line chart with production and consumption datasets.
- [x] Switching between Day, Week, and Month triggers `loadChartData(key)` and updates chart coordinates.
- [x] Tapping data points updates the inspection banner with accurate window metrics.
- [x] Delta bar chart visualizes net surplus/deficit periods accurately.

#### Technical Details
- **Component**: `src/components/dashboard/ChartsView.js`
- **State Hooks / Context**: `useEnergy()` (`chartData`, `loadChartData`)
- **SVG Elements**: `Svg`, `Path`, `Circle`, `Line`, `Rect`, `Text`

---

### SOL-103: Energy Summery UI (Energy Summary & Sustainability UI)

#### Summary
Implement the Energy Summary & Sustainability screen presenting grid independence rating, carbon offsets, and ecological impact metrics.

#### User Story
As a cooperative member, I want to see my environmental scorecard and financial savings so that I understand the tangible ecological and monetary benefits of my solar investment.

#### Scope & UI Components
- **Grid Independence Scorecard**: Hero card with award badge, self-sufficiency percentage rating (`gridIndependence% Self-Sufficient`), visual progress bar, and summary explanation.
- **Carbon Footprint & Sustainability 2×2 Grid**:
  - *CO₂ Offset Today*: Daily avoided carbon emissions (`metrics.co2SavedKg kg`) and monthly projection.
  - *Trees Saved Equivalent*: Equivalent forest trees planted based on carbon absorption equivalence.
  - *Direct Bill Savings*: Dollar amount saved (`$metrics.monetarySaved`) calculated against standard grid tariffs.
  - *Coal Fuel Avoided*: Kilograms of coal combustion avoided at fossil fuel power plants.

#### Acceptance Criteria
- [x] Displays grid independence percentage rating and visual progress fill.
- [x] Displays 4 distinct environmental metrics with custom icon badges.
- [x] Automatically computes monthly projection and tree equivalence from context metrics.
- [x] Follows glassmorphic design theme with high-contrast typography.

#### Technical Details
- **Component**: `src/components/dashboard/EnergySummaryView.js`
- **State Hooks / Context**: `useEnergy()` (`metrics`)
