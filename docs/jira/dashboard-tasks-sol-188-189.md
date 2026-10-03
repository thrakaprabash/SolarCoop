# Dashboard Tasks: SOL-188 & SOL-189
## Jira Task Descriptions & Specifications

**Associated Jira Tasks:** SOL-188, SOL-189  
**Module:** Dashboard & Analytics  
**Status:** Completed  

---

### SOL-188: Energy Summary Card Export & Sharing UI

#### Summary
Build an export and social sharing flow on the Energy Summary & Sustainability view, allowing household members to generate a verified clean impact scorecard and share accomplishments via native dialogs or clipboard export.

#### User Story
**As a** Solar Co-op household member,  
**I want** to generate and share a clean energy impact scorecard showcasing my off-grid self-sufficiency rating, solar generation, and avoided CO₂,  
**So that** I can share my sustainability milestones on social media, celebrate clean power with neighbors, and promote community microgrid adoption.

#### Scope & Implementation
- **Impact Modal Component (`src/components/dashboard/ShareImpactModal.js`)**:
  - Modal presentation with backdrop overlay and close trigger.
  - Live preview card rendering SolarCoop branding, member verification badge, and timestamp.
  - Multi-ratio format selector:
    - **Square (1:1)**: Post layout for Instagram, LinkedIn, and social feeds.
    - **Story (9:16)**: Tall aspect ratio for WhatsApp Status and Instagram Stories.
  - Color theme presets:
    - **Solar Amber** (`#F59E0B`), **Emerald Eco** (`#14B8A6`), and **Electric Blue** (`#3B82F6`).
  - Scorecard metrics:
    - Central Off-Grid Independence rating (`% Self-Sufficient`).
    - 2×2 metric breakdown: Clean Solar Generated (`kWh`), CO₂ Avoided (`kg`), Trees Saved Equivalent, and Tariff Bill Savings (`$`).
    - Microgrid community sharing metric (`kWh` shared with neighbors).
- **Native & Web Sharing Flow**:
  - Utilizes React Native's `Share.share` with fallback to `navigator.share` on Web.
  - One-tap "Copy Text" button for clipboard sharing with dynamic checkmark feedback.
  - Export card simulation with toast confirmation.
- **Integration in `src/components/dashboard/EnergySummaryView.js`**:
  - Top header action button with amber glow: "Share Impact".
  - Bottom CTA banner: "Celebrate Your Clean Energy" with "Export Card" button.

#### Acceptance Criteria
- [x] Member can open the Share Impact Modal from Energy Summary header and bottom banner.
- [x] Scorecard preview updates in real-time when switching between Square (1:1) and Story (9:16) aspect ratios.
- [x] Theme color toggle updates linear gradient and badge accents across the preview card.
- [x] Tapping "Share Impact Card" triggers the native device share sheet with formatted impact text.
- [x] Tapping "Copy Text" copies clean energy stats to clipboard and displays instant visual confirmation.

---

### SOL-189: Dashboard Tab Performance & State Caching

#### Summary
Implement a high-performance Keep-Alive / Persistent Caching architecture for Dashboard sub-tabs (`HomeDashboard`, `ProductionView`, `ConsumptionView`, `SurplusView`, `DeficitView`, `EnergyHistoryView`, `ChartsView`, `EnergySummaryView`), eliminating component unmounting, preventing layout flicker, and preserving internal state and scroll positions.

#### User Story
**As a** Solar Co-op mobile application user,  
**I want** seamless, instant switching between dashboard tabs without waiting for re-renders or losing my scroll position and active chart filters,  
**So that** I experience a responsive 60fps mobile application feel when navigating between real-time telemetry, historical charts, and sustainability metrics.

#### Scope & Implementation
- **Persistent Tab Container (`src/components/dashboard/CachedDashboardContainer.js`)**:
  - Replaced dynamic unmount-and-remount switch statements with a persistent tab pane manager.
  - **Lazy Initialization**: Sub-tabs are only mounted once navigated to for the first time, minimizing initial load footprint.
  - **Keep-Alive View Hierarchy**: Once mounted, sub-tabs remain in the component hierarchy using `display: 'flex'` (active) and `display: 'none'` (hidden), preserving native scroll offsets, active timers, and local state.
  - **Memoization**: Sub-views are wrapped with `React.memo` to eliminate background tab re-renders when parent states update.
  - **Accessibility**: Inactive panes set `accessibilityElementsHidden={true}` and `importantForAccessibility="no-hide-descendants"` to ensure assistive technologies only focus on active tabs.
- **State & Sub-tab Persistence (`src/context/EnergyContext.js`)**:
  - Key: `@solarcoop_active_subtab_v1`.
  - Automatically restores user's last selected dashboard tab on application launch.
  - Exposes in-memory cache helpers (`updateTabStateCache`, `getTabStateCache`, `clearTabStateCache`) to support tab-level caching.
  - Isolates sub-tab navigation re-renders so the root `MemberApp` shell does not re-render unnecessarily.

#### Acceptance Criteria
- [x] Switching between dashboard sub-tabs is instantaneous without re-mount lag or flicker.
- [x] Previously visited sub-tabs retain their internal scroll position and filter state (e.g., date ranges on ChartsView).
- [x] Sub-tabs that haven't been visited yet are lazily loaded on first access.
- [x] User's last active sub-tab preference persists across sessions via AsyncStorage (`@solarcoop_active_subtab_v1`).
- [x] Background tabs do not trigger unnecessary re-renders when inactive.
