# Technician test commands

Run these in **PowerShell** from the project root. The individual case catalogue
and expected results are in [Technician test cases](TECHNICIAN_TEST_CASES.md).

## Setup

```powershell
cd "F:\SLLIT _projects\SolarCoop"
```

Install the existing project dependencies if this checkout has not been set up:

```powershell
npm install
```

The automated unit and PGlite database tests do not require the Expo server, a
running simulator, a technician login or a live Supabase connection. Database
fixtures are temporary local databases, not the hosted project.

## Each suite separately

### 1. Repair database, access permissions, drafts and completion

```powershell
node --test tests/technician-database.test.cjs
```

### 2. Photo validation, upload failures and repair service calls

```powershell
node --test tests/repair-photo.test.cjs
```

### 3. Ordered saves on the same job

```powershell
node --test tests/job-mutation-queue.test.cjs
```

### 4. Household/technician subscriptions and stale-response protection

```powershell
node --test tests/fault-alert-sync.test.cjs
```

### 5. New-fault deduplication, urgency and chime asset

```powershell
node --test tests/technician-fault-inbox.test.cjs
```

### 6. System Health, community feed and fleet RPC permissions

```powershell
node --test tests/technician-system-health.test.cjs
```

### 7. System/Light/Dark appearance and palette contrast

```powershell
node --test tests/technician-theme.test.cjs
```

### 8. Automatic fault dispatch, repair recovery and other simulator database cases

```powershell
node --test tests/simulator-database.test.cjs
```

Run this whole file rather than selecting a nested simulator case in isolation:
its cases share the same database, device and fault setup.

## All core technician tests together

These seven files contain 27 top-level tests at the documentation date:

```powershell
node --test tests/technician-database.test.cjs tests/repair-photo.test.cjs tests/job-mutation-queue.test.cjs tests/fault-alert-sync.test.cjs tests/technician-fault-inbox.test.cjs tests/technician-system-health.test.cjs tests/technician-theme.test.cjs
```

Include simulator database integration as well:

```powershell
node --test tests/technician-database.test.cjs tests/repair-photo.test.cjs tests/job-mutation-queue.test.cjs tests/fault-alert-sync.test.cjs tests/technician-fault-inbox.test.cjs tests/technician-system-health.test.cjs tests/technician-theme.test.cjs tests/simulator-database.test.cjs
```

## One named case

Successful closure and permanent repair evidence:

```powershell
node --test --test-name-pattern="closing saves one immutable record" tests/technician-database.test.cjs
```

Incomplete closure must fail safely:

```powershell
node --test --test-name-pattern="invalid or incomplete closure" tests/technician-database.test.cjs
```

The pattern matches the test's title, not the catalogue's TECH-* identifier.
Unmatched cases may appear as skipped; that is expected for a filtered run.

## Project-wide tests and bundle checks

All `tests/*.test.cjs` suites:

```powershell
npm test
```

Simulator engine, loop and database checks:

```powershell
npm run test:sim
```

Check that web and native bundles build; exports do not execute phone workflows:

```powershell
npx expo export --platform web
npx expo export --platform all
```

## Optional browser smoke check

Prerequisites: the `playwright` package must be resolvable by Node (installed locally
or supplied through `NODE_PATH`), and Microsoft Edge must be installed. The script
launches Edge headlessly and intercepts Supabase requests with isolated fixtures.

```powershell
npx expo export --platform web --output-dir .technician-web-check
$env:ALERT_WEB_DIR = ".technician-web-check"
node tests/technician-alert-browser-smoke.cjs
```

The script defaults to `.technician-redesign-web` if `ALERT_WEB_DIR` is not set;
the explicit directory above is already covered by the project's ignore rules.
No separate Expo development server is needed for this exported-app check.

## Start the app for manual phone tests

```powershell
npm start -- --go --lan
```

Connect phone and computer to the same Wi-Fi, scan the QR code in Expo Go, and
use approved demo accounts. Open `http://localhost:5050/` on the computer for
simulator fault injection. These manual actions use the configured hosted demo
project and change its demo jobs/readings, unlike the local automated fixtures.

## Reading output and common setup problems

- A passing test means its assertions matched the expected behavior. A failing
  test reports the title, error and location; read that detail before rerunning.
- A successful full run should finish with `fail 0`. Filtered runs may include
  skipped cases. Copy real output into the run record; this guide does not claim
  a new test execution.
- `Cannot find module`: install the existing dependencies. For the optional
  browser script, check that Playwright is available to Node.
- Browser check reports a missing export: finish the export and confirm
  `ALERT_WEB_DIR` points to the directory containing `index.html`.
- In a restricted agent sandbox, the local HTTP simulator/browser checks may
  fail because loopback connections are denied (`EACCES`). Run in a normal local
  terminal or an environment allowing loopback; do not assume the startup timeout
  means the Supabase setup needs to be reapplied.
- Passing local tests does not confirm camera permissions, Maps behavior,
  hosted storage policies or physical-device notifications. Use the manual
  checklist in the case catalogue for those checks.
