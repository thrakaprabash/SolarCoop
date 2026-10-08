# SolarCoop Energy & Fault Simulator

Standalone HTML/ES-module control page for virtual household inverters. It writes the existing energy, chart, alert and technician-job tables through demo-key-checked Supabase RPCs. No Expo server or account login is required.

## Setup

1. Apply `supabase/migrations/0011_simulator.sql` in the Supabase SQL editor **after** the existing energy/alerts/trade/technician migrations through `0010`. The existing `profiles`, `energy_records`, `transactions` and `jobs` tables must exist.
2. In the SQL editor, configure a demo key (12 characters minimum; 72 bytes maximum):

   ```sql
   select public.sim_set_key('replace-with-your-demo-secret');
   ```

   This helper is accessible to the database administrator only. Rotating it also pauses the simulation and releases the leader lease.
3. Copy `simulator/config.example.js` to `simulator/config.js`. Fill in the app's Supabase URL and **public anon or publishable key**. The page rejects service-role/secret keys. `config.js` is ignored by Git.
4. Run `npm run sim`, then open `http://localhost:5050/?key=YOUR_DEMO_KEY`.
5. Click **Create virtual inverters** to create one device per existing owner/consumer profile. Consumers have no panels. Then choose **Sunny noon**, a speed, and **Play**.

For a local preview without configuration or database writes, open `http://localhost:5050/?preview=1`. Preview jobs remain local; accepting and repairing a real job requires a configured Supabase project and technician app.

Deploy the contents of `simulator/` to any static host, including the configured `config.js`. Share its `/?key=…` link with demo operators. The local server listens only on `127.0.0.1`; use hosting for phone access. Keep an operator tab open while running.

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

The database enforces a 15-second controller lease; other tabs show results as viewers and can take over after expiration. Calls are serialized, failed connections pause writes and retry with bounded backoff, and tick identifiers protect retries. After tab suspension, elapsed integration is capped at 15 real seconds to avoid a large surprise jump.

## Implementation choices

The browser uses the Supabase REST RPC endpoint directly, avoiding a CDN SDK dependency. Snapshots poll about every three seconds through a key-checked RPC. Anonymous SELECT access is deliberately absent from simulator tables; Postgres Realtime would require granting those reads. This keeps configuration, household details and event payloads behind the demo key. The signed-in mobile dashboard does use its existing RLS-protected Realtime connection, with the original 30-second poll as fallback.

`0011` extends the existing immutable job-closure trigger with a private, transaction-scoped operator authorization marker. Only key-checked simulator RPCs can create that marker. Re-running older `0010` after `0011` replaces this extension: reapply `0011` afterward if that happens.

`src/engine/` is browser-independent and covered by Node tests. The optional headless runner from phase 6 is not included. The flow visualization shows the community balance; it does not automatically approve P2P trades.

## Verification

```sh
npm run test:sim
npm test
npx expo export --platform web
```

Database tests run the actual migrations in PGlite with pgcrypto, including wrong-key denial, private-table denial, lease enforcement, invalid batches, retry deduplication, P2P sale accounting, fault dispatch, evidence-required technician closure, automatic recovery, manual clear, E06/E07, repeatable backfill and reset restoration. Engine tests cover sunlight/weather/load, all fault effects, Colombo midnight rollover, accumulation, battery limits and seeded randomness.

Browser smoke testing can use `node simulator/tests/browser-smoke.cjs` with Playwright installed or provided through `NODE_PATH`. Set `SIM_BROWSER_CHANNEL` if needed (default `msedge`). Start `npm run sim` first. It exercises the offline preview, not hosted Supabase.

Before a team demo, connect the configured page and app to the same demo project and rehearse the plan's six-minute flow twice: backfill → noon → P2P request/approval → E01 → technician accepts/uploads/closes → recovery → evening. Confirm admin stale-data scanning after E07 and Insights/Impact history on the real project. No hosted migration or phone rehearsal is performed by these local tests.
