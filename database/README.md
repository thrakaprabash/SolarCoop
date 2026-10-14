# SolarCoop database workflow

The app continues using Supabase Auth, Realtime and its existing RPCs. The pinned Supabase CLI manages database repairs and future SQL migrations from this repository.

## Connect and repair the simulator

```sh
npm run db:login
npm run db:doctor
npm run db:repair-simulator
```

Login authenticates your Supabase account locally. Doctor reads only schema metadata. Repair applies the tested generated-surplus function patch, then repeats the schema checks. It does not reset the database, seed households, change credentials or replay old migrations. It requires access to the project used by the app's `.env`.

Optional automation credentials belong in ignored `.env.db.local`, using `.env.db.example` as a template. Never put a database password or account access token in an `EXPO_PUBLIC_` variable. No credential belongs in a commit.

## Capture the existing database before future migrations

Keep Docker running for schema capture. The first capture downloads the Supabase images used for a temporary shadow database and can take several minutes.

```sh
npm run db:baseline
npm run db:status
```

Baseline links the exact project in the app settings, then captures its existing public, trade and simulator schemas using the CLI's pg-delta engine. Supply the database password locally if prompted. The CLI records this captured schema in migration history. The script writes `database/baseline.json` only after a successful capture. Inspect and commit the generated SQL and metadata together. Managed auth/storage policies should also be inspected and captured separately when changed; platform-managed auth/storage tables are not replaced by these commands.

The historical `supabase/migrations` files include duplicate versions and SQL previously run manually. They remain as references for existing docs, simulator setup and regression tests. They are deliberately outside the CLI workdir. They are not automatically marked applied, renamed, or replayed over existing tables. Active CLI migrations live in `database/supabase/migrations`, which starts empty until the real schema is captured. This avoids guessing what has already run remotely.

## Future changes

```sh
npm run db:new -- describe_the_change
# Edit the generated SQL in database/supabase/migrations.
npm run db:plan
npm run db:push
```

Plan prints pending migrations without applying them. Push runs that plan first and then applies migrations. Both refuse to run before a baseline exists or if its project differs from the app's project. Baseline files must remain present. There is no database reset command in the npm workflow.

Schema repairs made with `db:repair-simulator` before the first baseline are included in that capture. After adopting the managed migration history, add subsequent changes as new timestamped migrations instead of editing a migration already applied to the database.

Supabase references: [database migrations](https://supabase.com/docs/guides/local-development/database-migrations), [CLI commands](https://supabase.com/docs/reference/cli).

## Demo households

`database/demo-households.json` describes five additional owners and eight consumers, using fictional identities. Owner arrays use 400 W panels; consumers have meters with no solar or batteries. Different small/family/large/business load profiles produce different daily usage patterns.

```sh
npm run db:seed-demo
npm run db:seed-demo -- --apply
npm run db:seed-demo -- --verify-feed
```

The first command previews the exact app project. Apply creates confirmed demo logins with the Supabase Auth Admin API, verifies the automatically provisioned profiles/devices, configures each new device, and checks every login. It uses the existing CLI login to obtain server-side access in memory. No admin key is written to disk or bundled in Expo. Existing unrelated accounts are preserved; a repeated apply does not reset configured devices or account passwords.

The generated **`docs/DEMO_ACCOUNTS.local.md`** contains the login/password table, hardware details and demo steps. The credentials JSON and Markdown file are both excluded from Git. Keep the credentials JSON for repeat runs. Passwords for previously existing users cannot be retrieved and are not included. Verification checks that the running simulator has written fresh, matching readings for all thirteen new users. Normal simulator controls at `http://localhost:5050/` are backed by the database; `?preview=1` is a local-only preview.
