# Admin alerts and simulator integration

The simulator and technician repair flow now share these admin behaviors:

- Energy history is read across all pages. Baselines and deficit calculations use
  one final reading per household per Asia/Colombo day. Simulator baseline and
  sustained-deficit checks exclude the incomplete current day. Device faults still
  create their own immediate alerts and technician jobs.
- Ledger and Alerts subscribe to database changes, with a ten-second polling
  fallback and foreground refresh. While the admin portal is open in the foreground,
  threshold scans run every minute. There is no server scheduler.
- Energy alerts auto-resolve when a successful scan confirms recovery. Failed
  checks retain their existing alerts. Large transaction alerts remain open for
  review until manually resolved or the transaction is reversed.
- Manual resolution/dismissal cooldown starts at the database's `resolved_at`.
  Auto-resolution adds no cooldown to a returning incident. Event-specific alerts
  retain once-only behavior. System alerts cannot be deleted or relabelled as
  manual alerts to bypass that restriction.
- Handling a request, signup or complaint closes its linked operational alert
  immediately through a database trigger. New complaint alerts contain the complaint
  reference. Old complaint notices without a reference cannot be safely matched;
  admins must resolve those legacy notices manually.
- Reversal requires a reason of 10–500 characters. The database records the admin
  and time, keeps the transaction immutable, and prevents undoing a reversal.
  Retrying a reversal creates no additional log entry. Each new reversal writes one
  resolved admin log, rather than two open alerts. Historical reversals keep their
  existing history; missing audit details are shown as unknown.

## Database rollout

Apply `database/supabase/migrations/20261010120000_admin_alert_lifecycle.sql` before
running the updated admin app. Use the project's existing managed migration workflow:

```sh
npm run db:plan
npm run db:push
```

Inspect the plan because these commands include every pending managed migration,
including technician Health/feed migrations. The new migration does not reset
simulator data or rewrite historical trades. Historical closed alerts receive a
cooldown starting at migration time because their original resolution time is unknown.

The downloaded `transaction-ledger.md` describes the older reversal behavior.
The downloaded `alert_system_plan.md` anticipates the lifecycle implemented here,
but its reference to migration 0008 is superseded by the managed migration above.

## Validation

`node --test tests/admin-alert-integration.test.cjs` covers daily cumulative readings,
Colombo dates, pagination, recovery after failed checks, cooldowns, and actual
Postgres enforcement of audited reversals, alert protection and event recovery.
`npm test` checks the existing simulator and technician behavior as well.

The simulator HTTP test needs local loopback access. In a sandbox that denies
`127.0.0.1` connections, a startup timeout does not establish a simulator defect.
Web/native exports verify bundles; hosted database setup and phone behavior still
require a rehearsal after applying migrations.
