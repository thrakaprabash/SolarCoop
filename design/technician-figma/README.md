# SolarCoop technician — current app to Figma

Prepared 14 October 2026 from the current repository implementation. This handoff reconstructs the existing technician workspace; it is not a new product proposal or a capture of an authenticated running session.

**56 editable design snapshots: 28 screens and states in light and dark themes.** Open `preview.html` to browse every frame. The two `overview-*.png` files show the main areas at a glance.

## Put the designs into your existing Figma file

### Quick import

1. Extract the ZIP.
2. Open your existing Figma design file and create a page called `Technician — Current App`.
3. Drag the SVG files from `svg/` onto that page. Choose `dark-*.svg` for the dark layout in your reference, or `light-*.svg` for the light app appearance.
4. Each file becomes a vector screen. Figma may outline SVG text during import. Use the native importer below when you need editable text and built-in prototype navigation.

### Native text, shapes, and prototype navigation

Use Figma's desktop app with permission to run development plugins.

1. In Figma, choose **Plugins → Development → Import plugin from manifest** and select `plugin/manifest.json`.
2. If your Figma version requires an assigned plugin ID, use **Development → New plugin** to create a local Figma Design plugin. Copy the generated `id` into the supplied manifest, or copy `plugin/code.js` into that new plugin's folder and use the supplied manifest fields while keeping its assigned ID. A Figma-assigned ID is intentionally not fabricated in this package.
3. Open the existing SolarCoop Figma file.
4. Run **SolarCoop · Current Technician Workspace** from Development.
5. The importer creates a new page containing all 56 frames. Text, rectangles, and icons are editable. Dashboard tabs, job links, acceptance, closure, profile editing, retry links, and theme choices have prototype connections.

Importing creates a separate page each time. Frames use explicit coordinates and named layers; they are not an Auto Layout component library. Prototype links illustrate navigation between prepared states: they do not save data, upload photos, play sound, sign out, or launch Google Maps. The local importer does not require a network connection.

If native Sinhala or Tamil labels show missing glyphs, install/select a matching font such as Noto Sans Sinhala or Noto Sans Tamil. The importer uses an available matching font when it finds one.

## Screen inventory and source mapping

| Area | Included screens/states | Implementation |
| --- | --- | --- |
| Job board | Active, pending, completed, empty pending, initial loading, retry error, offline | `src/technician/screens/TechnicianDashboardScreen.js` |
| Ticket dossier | Pending, accepted by you, completed repair record | `src/technician/screens/JobTicketDetailScreen.js` |
| Repair closure | No evidence/disabled completion; evidence, checked steps, saved notes/ready completion | `src/technician/screens/JobClosureScreen.js` |
| Diagnostics | Collapsed alerts, expanded editable checklist, pending read-only checklist, no faults | `src/technician/screens/DiagnosticsScreen.js`, `components/CriticalAlertCard.js` |
| System health | Community feed, attention view, partial readings, no search results, unavailable/retry, six health-status examples | `src/technician/screens/SystemHealthScreen.js`, `components/CommunityEnergyFeed.js` |
| Profile | Technician profile, edit form, logout confirmation | `src/screens/ProfileScreen.js`, `src/components/common/LanguageSwitcher.js` |
| Workspace settings | System/light/dark appearance, sound enabled, test sound, browser help | `src/technician/components/TechnicianAlertCenter.js` |
| Incoming fault | Foreground fault notification, review and dismiss | `src/technician/components/TechnicianAlertCenter.js` |
| Additional states | Empty active/completed; upload/preview/camera/history/audio errors; save/upload busy examples | Respective screen/component files above |

The older screenshot has three navigation items and a consumer/technician split comparison. The current technician app has **Dashboard / Diagnostics / Health / Profile**. This package covers the technician side. The household's maintenance notice belongs to the consumer app, so the old split comparison is not presented as a technician screen.

## Workflow and state rules

- Header: SolarCoop, Field service, Live / Syncing / Offline, workspace settings.
- Dashboard hero: Job board, cooperative repair caption, Waiting / In progress / Urgent counts. Urgent opens Diagnostics.
- Active filter contains accepted work plus the pending queue. Pending and completed filters show their own lists. Pending/active filters show counts; Completed does not.
- Pending and active work sorts urgent → medium → low. Completed work has a green completion badge.
- Ticket details contain client/contact/address, Google Maps action, device telemetry, fault code/location, and maintenance timeline.
- Pending jobs can be accepted. An active job displays who accepted it; the current technician gets the closure action for their own work.
- Diagnostics expand one ticket at a time. Checklist editing is limited to the technician's own active job and disabled during pending saves. Pending jobs show an acceptance hint.
- Repair evidence supports Take Photo and Choose Photo, JPG/PNG, up to 10 MB. Photos have saved timestamps and preview retry states.
- Notes can be saved as drafts, including when leaving the closure form. Completion requires at least one photo, trimmed notes of at least 10 characters, and no busy operation. The UI does not require every checkbox to be checked before enabling completion.
- Completion returns to Dashboard → Completed. The completed dossier includes notes, the saved checklist, and the assigned technician's repair evidence.
- Health is read-only. Search matches owner, household ID, or inverter serial. Attention includes all non-healthy systems. View Job appears only when a visible open ticket exists.
- Health statuses: Healthy, Fault, Offline, Degraded, Stale reading, No reading. Fault/device state takes precedence; zero output alone does not mean a fault. A reading is fresh for 60 seconds. Monitoring refreshes every 10 seconds while active.
- Community feed includes production, consumption, net balance, pool today, open faults, repair jobs, freshness, and owners → pool → consumers with grid direction. Partial totals use fresh households; net balance is unavailable until all household readings are fresh. Unavailable values appear as `—`.
- Profile has a green technician hero, account status, role, full name, mobile number, household ID, language selector, save/cancel editing, and confirmed logout. Technician profiles do not include solar capacity.
- Alert sound is foreground-only, with per-technician preference. Web users need a user gesture such as Test sound to allow audio.

## Fidelity and samples

Colors are read directly from `src/technician/theme.js`; labels come from the English locale and screen source. Icons come from the app's installed Lucide package. Spacing and type follow the source where practical, with handoff adaptations to fit standalone frames. These are source-derived reconstructions, not pixel-exact screenshots.

Frames are 390 px wide. Tall frames show full scroll content; their height is not a new device size. For device prototypes, place long content inside a 390 × 844 viewport with vertical scrolling and fixed header/tab bar. The plugin's supplied snapshots are tall frames, without that scrolling conversion.

Names, contacts, addresses, ticket counts, history dates, energy measurements, and timestamps are illustrative. `example.com` and the sample telephone number do not refer to a customer. Repair-image rectangles are clearly labeled placeholders, not evidence captured from the app. Dialog appearance is illustrative because native Android/iOS and browser confirmations differ.

## Files

- `preview.html`: all-screen gallery with theme toggle.
- `overview-light.png`, `overview-dark.png`: main-area overview images.
- `svg/`: 56 standalone vector frames.
- `rendered/`: PNG previews of all frames.
- `plugin/manifest.json`, `plugin/code.js`: native Figma development importer.
- `screens.json`: scene data and exact app theme tokens.
- `FIGMA-PROMPT.md`: implementation brief to paste into a Figma design-generation tool.
- `generate.cjs`, `importer-runtime.js`: maintainable generator and importer source.

Regenerate from the repository root with `node design/technician-figma/generate.cjs`. Icon generation uses the existing `node_modules` package. PNG rendering uses `render-preview.cjs` and this workspace's bundled Sharp runtime.

## Verification

All SVGs were rendered successfully, and the light/dark overview images were visually reviewed. Frame bounds and every prototype destination were checked. The importer was syntax-checked and exercised against an API-shaped local harness. Execution inside a real Figma file remains unverified because no Figma connector/session is available here.

Figma API implementation references: [Figma global API](https://developers.figma.com/docs/plugins/api/figma/), [plugin manifest](https://developers.figma.com/docs/plugins/manifest/), [prototype reactions](https://developers.figma.com/docs/plugins/api/properties/nodes-reactions/). Repository requirement reviewed: [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).
