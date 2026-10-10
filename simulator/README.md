# SolarCoop Energy & Fault Simulator

Virtual household inverters feed energy, charts, faults and technician jobs into the app's Supabase database. `npm start` starts Expo and a Node simulator that generates readings automatically. The browser page is an optional control panel for weather and faults; it can be closed while the demo continues. No operator login or key entry is required.

## Setup

1. Run `npm start`. The simulator uses the app's existing `.env` Supabase URL and public key automatically. `npm run android`, `npm run ios` and `npm run web` also start both processes. `npm run start:app` starts Expo alone; `npm run sim` starts only the simulator.
2. **Once per local setup:** copy the generated `simulator/.demo-setup.sql` into Supabase SQL Editor and run it. It includes migrations `0011`, `0012` and `0013` and automatically configures the local server's control credential. Existing app migrations through `0010` must already be applied. You do not choose, copy into a form, or enter a key. The server retries setup and starts feeding readings after the SQL succeeds. If setup was already applied, run only `0013_simulator_generated_surplus.sql` to fix generated-column writes; the key and existing demo data remain unchanged.
3. Log into the app as an approved solar owner to see readings. Optionally open `http://localhost:5050` to change weather, load, speed or inject a fault. Generation starts at sunny noon and 60× speed automatically. Closing the browser does not stop it. **Pause** stops generation; **Play** resumes. Stop the terminal to stop the runner.

Existing and newly registered owner/consumer profiles receive virtual devices automatically. Owners default to 4 kW when no capacity is specified; consumers have no panels. Unrelated profile updates preserve simulator settings. **Create virtual inverters** recreates devices after **Reset all**.

The app reads `energy_metrics`, `energy_records`, `chart_data` and jobs. It shows an empty state until readings arrive, and marks readings stale after one minute without a new database timestamp. Production charts use stored day readings; unsupported measurements show an unavailable value. Dashboard share/borrow controls open the existing P2P request/approval flow.

For a local preview without configuration or database writes, open `http://localhost:5050/?preview=1`. Preview jobs remain local; accepting and repairing a real job requires a configured Supabase project and technician app.

The control panel runs on the development computer at `127.0.0.1`. The mobile app reaches Supabase directly and does not need access to this local page. Preview mode remains optional and never feeds the app database.

## Controls and data

- Live clock follows Asia/Colombo. Demo clock supports a time slider and 1×/10×/60×/360× speed.
- Weather, household loads, solar capacity, panel/string counts and optional batteries are adjustable. Consumer-only devices cannot receive inverter faults.
- E01–E08 follow the catalog in the plan, including E06 string selection and E07 missing readings. Random faults are off by default; their per-device probability is adjustable.
- Fault insertion atomically creates a telemetry job and system alert. A technician's normal **accept → photo evidence → close** flow automatically resolves the fault and alert. The browser notices recovery within its next snapshot poll.
- Manual clear asks for confirmation when a technician has accepted the job. Its completed closure record explicitly identifies a simulator operator; technician evidence requirements remain in place.
- Energy metrics update every tick. Records and day charts update every tenth tick, at real-day rollover, and immediately after control/fault changes. Real timestamps keep the existing app's today logic working; demo time drives the production/load curves. Totals persist across page refreshes.
- P2P surplus readings account for completed sales since real Colombo midnight, so subsequent simulator readings do not restore already sold kWh. Trade transactions themselves are never reset.
- Backfill creates 7 or 30 completed historical days, then refreshes week/month charts. Repeating it replaces only the simulated history for those dates.
- **Reset data** pauses, clears open simulator faults, removes simulated energy, restores the original metrics/chart rows replaced by the simulation, and retains completed simulator job history. **Reset all** additionally deletes virtual devices, fault/job/alert history and events. Original jobs, complaints, trades and energy records remain.

The database enforces a 15-second controller lease so only one runner writes. Local control tabs share that runner's serialized command queue. Failed connections retry with bounded backoff, and tick identifiers protect retries. Elapsed integration is capped at 15 real seconds after suspension.

## Implementation choices

The local Node process uses Supabase REST RPCs directly. Browser snapshots poll about every three seconds through the local server. Anonymous SELECT access remains absent from simulator tables. The signed-in mobile dashboard uses its RLS-protected Realtime connection, with a 30-second poll as fallback.

`0011` extends the existing immutable job-closure trigger with a private, transaction-scoped operator authorization marker. Only key-checked simulator RPCs can create that marker. Re-running older `0010` after `0011` replaces this extension: reapply `0011` afterward if that happens.

`src/engine/` and the runner are browser-independent and covered by Node tests. The flow visualization shows the community balance; it does not automatically approve P2P trades.

The local server retains the database credential in ignored `.demo-key` and `.demo-setup.sql` files. Neither is served to browsers or committed. The browser uses same-origin local control endpoints; the Node process serializes controls with ticks. Database key checks, private-table restrictions and household RLS remain enabled. Starting another checkout generates its own local credential; run that checkout's setup SQL once before using it.

## Verification

```sh
npm run test:sim
npm test
npx expo export --platform web
```

Database tests run the actual migrations in PGlite with pgcrypto, including wrong-key denial, private-table denial, lease enforcement, invalid batches, retry deduplication, P2P sale accounting, fault dispatch, evidence-required technician closure, automatic recovery, manual clear, E06/E07, repeatable backfill and reset restoration. Engine tests cover sunlight/weather/load, all fault effects, Colombo midnight rollover, accumulation, battery limits and seeded randomness.

Browser smoke testing can use `node simulator/tests/browser-smoke.cjs` with Playwright installed or provided through `NODE_PATH`. Set `SIM_BROWSER_CHANNEL` if needed (default `msedge`). Start `npm run sim` first. It exercises the offline preview, not hosted Supabase.

To check the mobile-sized owner dashboard with isolated backend fixtures, export with `npx expo export --platform web --output-dir .simulator-web-check`, then run `node tests/dashboard-browser-smoke.cjs` with Playwright available. This covers missing readings, simulated metrics, fault cards, production, surplus and P2P navigation without writing to Supabase.

Before a team demo, connect the configured page and app to the same demo project and rehearse the plan's six-minute flow twice: backfill → noon → P2P request/approval → E01 → technician accepts/uploads/closes → recovery → evening. Confirm admin stale-data scanning after E07 and Insights/Impact history on the real project. No hosted migration or phone rehearsal is performed by these local tests.
