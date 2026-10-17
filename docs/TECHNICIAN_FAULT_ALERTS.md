# Technician fault alerts

Testing reference: [case catalogue](testing/TECHNICIAN_TEST_CASES.md) and
[run commands](testing/TECHNICIAN_TEST_COMMANDS.md).

Run SolarCoop and its local simulator together:

```sh
npm start -- --go --lan
```

Connect the phone and computer to the same Wi-Fi, scan the Expo QR code, and sign in with a technician account. Keep that workspace open. Open the sliders icon at the top right (**Workspace settings**) and press **Test sound** to check device volume, then inject a fault for a solar owner from `http://localhost:5050/`.

The same settings sheet offers **System**, **Light**, and **Dark** appearance, saved per technician on the device. System follows the phone's current appearance. The technician portal uses device safe-area insets for the status bar, display cutouts and bottom gestures. These appearance settings apply only inside the technician workspace, including its profile and repair forms. Job-board counts act as shortcuts to the pending queue, active jobs and fault diagnostics.

Diagnostics alerts start collapsed. **Show details** reveals the equipment and checklist; **Hide details** closes it. Only one alert expands at a time. Expanding and collapsing does not alter saved checklist progress or job permissions, and **View Job** is always available.

The **Health** tab monitors active solar-owner systems through a read-only, active-technician-only database function. It shows inverter status, open faults, output, daily generation, battery readings and the age of the last reading. It refreshes every ten seconds while open and on returning to the foreground. Readings older than one minute are stale; zero production alone is not a fault. Search and the attention filter help find a system, and job shortcuts follow the technician's existing job permissions. The page labels its simulator-fed source and provides no simulator control, reset or fault-injection actions. Unavailable readings stay unknown, and failed refreshes retain explicitly labelled last received data.

Its compact **Data feed** includes production, consumption, net balance, daily pool surplus, open inverter faults and open repair jobs. Household energy totals include both active owners and consumers, without exposing consumer profiles. Pool today sums positive daily household surplus, matching the simulator's display. Only fresh simulator readings contribute; partial totals are labelled and net balance stays unavailable until every registered active household has a fresh reading. The owners → pool → consumers diagram illustrates that balance, with a grid-direction indicator for surplus or shortfall; it does not claim a measured power transfer or completed energy trade.

The existing database trigger creates a pending telemetry job. The technician board receives it through Realtime, with a ten-second polling fallback. A new incident displays a banner with the ticket, inverter code and household; **Review incident** opens its existing job workflow. The overview shows pending, active and urgent counts from stored jobs.

The bundled original chime plays once for each new pending telemetry incident while the workspace is in the foreground. Existing jobs on initial login, manual demo seeds, repeated polls and duplicated events stay silent. Multiple faults in one update produce one chime and show the most urgent incident. Opening job details keeps the alert controller mounted. **Muted** suppresses automatic sounds while visual alerts continue, and the choice is saved per technician on the device. **Test sound** previews the chime even when alerts are muted. Browsers require a user gesture to allow audio.

Simulator **Clear** removes the incident from the pending queue and the owner's maintenance card. A completed technician repair retains its repair confirmation. No simulator-table read permission or microphone permission is needed for this feature.

This is a foreground demo feature. Notifications while the app is closed require a server-side push flow, registered device tokens, and push credentials; Android remote push notifications require a development build rather than Expo Go. See the [SDK 57 notifications documentation](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

Validation: `tests/technician-fault-inbox.test.cjs` covers deduplication and the audio asset; `tests/fault-alert-sync.test.cjs` covers job reconciliation. The optional `tests/technician-alert-browser-smoke.cjs` checks a web export with isolated backend fixtures, including real media playback, new and muted incidents, job review and mobile-width layout.
