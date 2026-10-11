# Sprint 4 — Technician Portal

## SOL-202: Repair evidence

The Close Job Ticket screen keeps the existing dark cards and orange controls.
Use Take Photo or Choose Photo to upload JPG/PNG evidence up to 10 MB. Each
upload is linked to the active job with a server timestamp and technician ID.
Saved photos load again when the ticket is reopened. Photos use private storage
and short-lived preview links; other technicians and households cannot read them.

## SOL-203: Checklist and repair notes

Checklist boxes are 26 × 26 pixels with full rows at least 48 pixels tall.
Taps save one step on the server so repeated taps cannot overwrite another step.
Save Notes keeps a draft on the job before closure. Going back from the form
also saves edited notes; a failed save keeps the form open for retry.

## SOL-204: Complete the repair

Add at least one photo and write 10 to 500 characters describing the repair.
Complete Resolution & Close Ticket saves a permanent snapshot of the current
photos, checklist, notes, technician and completion time in one transaction.
The dashboard switches to Completed. Reopening the ticket shows the repair
record and photo previews. Completed repair details cannot be changed.

The household sees the existing Maintenance Complete card through the same
job's realtime update (migration 0007). The message also appears on the next
refresh or app opening. This is an in-app notification; it does not send a push
notification or SMS.

## Supabase setup

Run `supabase/migrations/0008_job_repair_photos.sql` in the Supabase SQL Editor
after migrations 0006 and 0007. This creates the private repair-evidence bucket,
its access policies, the job photo column and the attachment function.

Then run `supabase/migrations/0009_job_repair_drafts.sql` for checklist and notes saves.

Finally run `supabase/migrations/0010_job_closure_record.sql` for atomic closure and the completion record.

Rebuild the native app to include the photo picker and its camera permission.
Expo Go can use the picker too. Camera capture needs a physical device.

## Verification

See [Technician test cases](testing/TECHNICIAN_TEST_CASES.md) for individual
scenarios and expected results, and [Technician test commands](testing/TECHNICIAN_TEST_COMMANDS.md)
for separate suite commands, combined runs and the manual phone checklist.

Run `npm test` for file validation, service failure handling and local PostgreSQL
checks. Run `npx expo export --platform all` to verify Android, iOS and web bundles.

Before release, test with real technician and household accounts after applying
the migration: camera permission denial, picker cancellation, JPG/PNG uploads,
oversized and unsupported files, reopening a ticket, and another technician's
access. Also close a job, reopen its completion record and check the household's Maintenance Complete card. Local checks do not confirm live Supabase configuration or phone behavior.
