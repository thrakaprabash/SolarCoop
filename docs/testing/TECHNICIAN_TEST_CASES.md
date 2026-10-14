# Technician test cases

SolarCoop technician coverage, checked against the test sources on 11 October 2026.
This is a case catalogue, not a record of a new test run.

For setup and copyable PowerShell commands, see [Technician test commands](TECHNICIAN_TEST_COMMANDS.md).

## What the automated tests use

- Unit/service tests use fixtures and replace platform or network boundaries.
- Database tests run the repository's SQL migrations in a local PGlite Postgres database.
- The optional browser check uses an exported Expo web app and intercepted backend responses.
- These tests do not modify hosted Supabase data or establish that a physical inverter,
  phone camera, phone speaker or background push notification works.

The seven core files contain **27 top-level tests**. The simulator file supplies
additional integration coverage; its other cases cover simulator behavior beyond
the technician module. The browser script is a separate check.

## 1. Repair database and access rules — 5 tests

Source: [technician-database.test.cjs](../../tests/technician-database.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-DB-01 | Assigned technician uploads and attaches evidence; repeat attachment; other technician, household and anonymous access | Evidence records technician/time, duplicate attachment adds no second copy, saved evidence cannot be deleted, unauthorized reads/uploads/attachments are denied. |
| TECH-DB-02 | Missing upload, unsupported metadata, file over 10 MB, and attachment to a non-active job | Invalid evidence and unauthorized uploads are rejected. |
| TECH-DB-03 | Toggle multiple checklist steps, toggle back, save/clear draft notes, use invalid indexes or another technician | Progress is preserved, notes are trimmed and saved without closing the job; invalid indexes, notes over 500 characters and unauthorized edits fail. |
| TECH-DB-04 | Close with valid evidence/notes; retry closure; attempt later edits; household reads completion; technician profile is removed | One immutable closure snapshot contains current checklist/photos/notes, technician and completion time. Household sees completion, retries preserve the record, later edits fail, and the snapshot retains technician identity. |
| TECH-DB-05 | Close with invalid notes, no photo, missing stored evidence, a direct status update or another technician | Closure fails without partially completing the job; saved draft remains, completion timestamp/snapshot remain absent, and no false completion message is produced. |

## 2. Repair photo validation and services — 6 tests

Source: [repair-photo.test.cjs](../../tests/repair-photo.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-PHOTO-01 | JPG/PNG signatures, empty bytes, unsupported bytes, exactly 10 MB and over 10 MB | Supported signatures and the size boundary are accepted; empty/unsupported/oversized input is rejected. This is signature validation, not a full image decoder test. |
| TECH-PHOTO-02 | Upload valid evidence | An ArrayBuffer is uploaded under the job's unique photo path before the attachment RPC; existing files are not overwritten. |
| TECH-PHOTO-03 | Wrong technician, completed job, or oversized selection | Rejection happens before any storage upload or attachment call. |
| TECH-PHOTO-04 | Storage upload fails; attachment fails after upload | A failed upload is not attached. Failed attachment triggers cleanup of the unattached upload. |
| TECH-PHOTO-05 | Close with notes and an obsolete client checklist | Closure sends notes through the server RPC and does not overwrite the server checklist with the obsolete client copy. |
| TECH-PHOTO-06 | Checklist, draft-note and completion RPC responses | Each request asks Supabase for one returned job object and the service reads it correctly. |

## 3. Job mutation queue — 2 tests

Source: [job-mutation-queue.test.cjs](../../tests/job-mutation-queue.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-QUEUE-01 | Multiple writes to the same job, including a failed write | Writes execute in order; a failure does not block the next write. |
| TECH-QUEUE-02 | Writes to different jobs | Separate jobs can save independently. |

## 4. Household and technician synchronization — 6 tests

Source: [fault-alert-sync.test.cjs](../../tests/fault-alert-sync.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-SYNC-01 | Operator clears a simulator fault; real technician repair completes; pending faults remain | Operator-cleared cards disappear while open faults and genuine repair confirmations remain. |
| TECH-SYNC-02 | Household job subscription receives updates and is disposed | Updates use the household filter and the subscription is cleaned up. |
| TECH-SYNC-03 | Dashboard and Alerts subscribe to the same household concurrently | Both subscriptions receive changes without interfering with each other. |
| TECH-SYNC-04 | Realtime misses a clear; polling and foreground refresh run | Cleared pending jobs leave the technician board through reconciliation. |
| TECH-SYNC-05 | Older fetch returns after a newer fetch or an account change | Old data cannot restore a cleared job or leak jobs across accounts. |
| TECH-SYNC-06 | Realtime clears a job while an older poll is in flight | The delayed poll cannot put the cleared job back. |

## 5. Fault inbox and chime asset — 3 tests

Source: [technician-fault-inbox.test.cjs](../../tests/technician-fault-inbox.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-INBOX-01 | Initial login contains faults; a new telemetry fault appears; polls/reconnect repeat it | Existing incidents seed silently and each new incident is emitted once. |
| TECH-INBOX-02 | Mixed urgency, active/completed jobs, manual seeds and a new inbox session | Only new pending telemetry incidents alert, highest urgency comes first, and initial session contents remain silent. |
| TECH-INBOX-03 | Inspect bundled WAV bytes | The asset is short mono 16-bit PCM with amplitude within the tested bounds. This does not test a phone's speaker or volume. |

## 6. System Health and community feed — 3 tests

Source: [technician-system-health.test.cjs](../../tests/technician-system-health.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-HEALTH-01 | Community surplus, deficit, zero balance, missing/partial readings and expired snapshots | Values distinguish surplus from shortfall; unavailable totals remain unknown and an incomplete feed does not claim a complete net balance. |
| TECH-HEALTH-02 | Fresh zero output, missing/invalid/future timestamps, stale readings and known faults | Zero output alone is not a fault; health distinguishes healthy, unknown, stale, offline, degraded and fault states. |
| TECH-HEALTH-03 | Anonymous/member/blocked technician access, active technician access, consumer devices, placeholder readings and another technician's job | Only an active technician can use the fleet RPC; private simulator tables remain unreadable, consumer hardware is excluded, inaccessible job links are masked, and placeholder measurements are not presented as real readings. |

## 7. Technician appearance — 2 tests

Source: [technician-theme.test.cjs](../../tests/technician-theme.test.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-THEME-01 | System appearance and explicit Light/Dark choices | System follows device appearance; an explicit choice overrides it. |
| TECH-THEME-02 | Text, priority colors and primary actions on light/dark surfaces | Tested foreground/background pairs meet a 4.5:1 contrast ratio. This is palette validation, not a full visual accessibility audit. |

## 8. Simulator-to-technician integration

Source: [simulator-database.test.cjs](../../tests/simulator-database.test.cjs)

These are relevant nested cases inside the simulator database test; run its whole
file because the cases share setup and state.

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-SIM-01 | Inject E01 and attempt a duplicate open fault | One telemetry Pending job and system alert are created atomically, the virtual device goes Offline, and duplicate open faults are rejected. No household complaint is required. |
| TECH-SIM-02 | Assign/accept the job, try closure without evidence, attach a photo and complete with notes | Missing evidence prevents closure; valid closure resolves the device fault and alert, returns the device Online, and subsequent readings show recovery. |
| TECH-SIM-03 | Invalid E06 string, valid E06, E07 missing readings and operator manual clear | Invalid strings fail, affected panels recover after clear, E07 leaves the reading timestamp unchanged, and manual closure is identified as simulator action with an immutable completion record. |

## 9. Optional browser smoke check

Source: [technician-alert-browser-smoke.cjs](../../tests/technician-alert-browser-smoke.cjs)

| ID | Scenario exercised | Expected result |
| --- | --- | --- |
| TECH-WEB-01 | Open the mobile-width technician workspace with backend fixtures; test sound/mute, new faults, themes, job review, diagnostic expansion and Health navigation | Controls and screens work together, new versus muted notifications behave correctly, diagnostics expand one at a time, and the Health/feed views render their fixture data without browser errors. |

This browser check does not prove hosted RLS or physical-device behavior.

## 10. Manual phone and hosted-project checklist

Use approved demo accounts on the same configured Supabase project. Start the app
and simulator using the commands guide. Record device, date, actual result and
Pass/Fail for each case rather than assuming automated tests cover these steps.

| ID | Steps | Expected result |
| --- | --- | --- |
| TECH-MANUAL-01 | Open photo capture, deny camera permission; cancel camera/gallery selection | A clear permission response or clean cancellation; no false attachment and existing repair details remain. |
| TECH-MANUAL-02 | On an accepted job, upload a camera photo and a gallery JPG/PNG, then reopen the ticket | Uploads are saved and private previews load again for the assigned technician. |
| TECH-MANUAL-03 | Try unsupported and oversized files | Validation explains the restriction; invalid evidence is not attached. |
| TECH-MANUAL-04 | Inject a fault for an owner, inspect both accounts, accept it, save checklist/notes, attach evidence and complete | Automatic ticket appears without a complaint. Owner sees a maintenance notice and assignment; valid repair produces completion, fault resolution and simulator recovery. |
| TECH-MANUAL-05 | Tap the job's Maps action on the phone | Maps opens the intended destination, or the app gives a clear unavailable-location response. |
| TECH-MANUAL-06 | While a job changes, background/foreground the app; briefly lose and restore connectivity | On recovery, the board and household card reconcile to saved status without restoring obsolete jobs. |
| TECH-MANUAL-07 | Test a new incident in the foreground, mute, inject another incident, then use Test sound | Visual incident alerts continue; automatic sound respects mute; Test sound works when device audio permissions/volume allow it. This is not a background push test. |
| TECH-MANUAL-08 | Open the same job with another technician and the household account | Assignment rules are respected and private technician evidence remains inaccessible to unauthorized users. |

## Recording results

Keep case identity separate from execution evidence. A simple run record is:

| Date / commit | Case or command | Environment | Actual result | Pass / Fail |
| --- | --- | --- | --- | --- |
| Fill when run | e.g. TECH-MANUAL-04 | Phone model / OS / demo project | What actually happened | Fill when verified |
