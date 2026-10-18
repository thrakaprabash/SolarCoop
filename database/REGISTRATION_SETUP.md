# Role-specific registration setup

Apply `supabase/migrations/20261018120000_role_registration_details.sql` **before using the updated registration form**.

## Supabase SQL Editor

1. Open the Supabase project used by the app's `EXPO_PUBLIC_SUPABASE_URL`.
2. Open SQL Editor and paste the **complete contents** of `database/supabase/migrations/20261018120000_role_registration_details.sql`.
3. Run the script. It uses a transaction and can be run again safely.
4. Verify with `select public.registration_details_version();` — the result must be `2`.
5. Reload Expo Go with `r` in Metro.

For projects managed through this repository's Supabase CLI migration history, use `npm run db:plan`, inspect the pending migration list, then `npm run db:push` instead. Choose one application path; if you run SQL manually, reconcile the matching CLI migration history before a future CLI push. Do not replay the historical baseline manually.

## Stored data

- `household_details`: owner/consumer address, city, district and optional consumer monthly usage.
- `solar_systems`: owner panel capacity in **kWp**, optional inverter brand/model, inverter capacity in **kW** and panel count. One system per owner for this release.
- `technician_details`: main service district, specialization, optional whole years of experience and qualification/certificate reference. A reference is self-reported, not verified certification.

New owners receive `pending_approval`; consumers and technicians receive `active`. Signup cannot request an admin role. Existing users and their account statuses are preserved. Their new details remain blank until completed through Profile; no address or real equipment data is invented. Legacy signup clients remain supported.

The existing auth insert trigger calls `handle_new_user`, which stores the profile and role details in the same signup transaction. Invalid details roll back the signup. Private registration details are then removed from auth metadata to keep them out of subsequent JWTs. The app checks the migration version before starting a new signup, so an older database cannot silently discard these fields.

Members read their own details; administrators read all details. A technician can read a household's address and solar system only after a job is assigned to them. Writes go through `save_my_registration_details`, which uses the signed-in user and validates the role and values. Anonymous users cannot read these tables.

New jobs receive the general city/district in `site_area`. Full addresses remain in the protected household table because the existing jobs read policy includes all technicians. The assigned technician's job detail screen retrieves the private address for display and Maps. Existing jobs and their historical addresses are preserved.

Real equipment details remain separate from `sim_devices`. Signup supplies panel capacity to the existing profile/device provisioning path; later real-system edits update the owner's profile capacity but do not reset simulator hardware, readings, panel faults or active jobs. Configure virtual hardware through the existing simulator controls when needed.

Validation limits match the current residential simulator: panel/inverter capacity greater than 0 up to 100, panel count 1–200, monthly usage 0–100000 kWh, experience 0–80 whole years. Inverter and panel capacities are independent; panel count is not inferred for real hardware.

Local regression coverage: `node --test tests/registration-details.test.cjs tests/registration-auth.test.cjs`.

The SQL file is supplied for deployment; generating it does not apply it to the hosted database.
