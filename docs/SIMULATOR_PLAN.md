# SolarCoop Energy & Fault Simulator — Implementation Plan

_Status: Proposed · Date: 2026-10-07 · Owner: TBD_

---

## 1. Why we need this

SolarCoop has no real inverters or smart meters connected, so every screen runs on static seed data. Nothing changes on the dashboards, no faults ever happen, and nobody can see energy moving through the community.

The **Simulator** is a **separate web page**. It acts as a set of **virtual inverters**, one per household. It:

- generates **live, changing solar production and household consumption** for every household
- calculates **surplus and deficit** and feeds the **P2P market**
- lets an operator **inject faults with error codes** (inverter offline, string disconnected, …)
- automatically **creates a technician job** when a fault happens
- **clears the fault automatically when the technician closes the job**, after which production comes back
- writes **the same Supabase tables the mobile app already reads**, so the app needs only small optional changes

The page opens with a simple URL and needs no login.

---

## 2. Goals & non-goals

| Goals | Non-goals |
|---|---|
| Realistic, controllable energy data for every household | Real hardware or inverter protocols (Modbus, SunSpec) |
| Manual control: time, weather, load, faults | Physically accurate PV modelling |
| Fault → job → repair → recovery loop with no human steps in between | Replacing the real complaint flow (it keeps working) |
| One standalone page, opened by URL, no login | User accounts or permissions inside the simulator |
| Simulated data is labelled and can be wiped | Running in production with real members |

---

## 3. Key decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Where it lives | **Separate static web page** in `simulator/` (plain HTML + ES modules). It is not part of the Expo app. |
| D2 | Access | **No login.** It opens at `https://<host>/?key=<demo-key>`. The `key` in the URL is a shared demo secret, not an account. |
| D3 | How it writes data | **Security-definer RPCs (`sim_*`)** callable with the public anon key. Each one checks the demo key, so the page never needs the `service_role` key. |
| D4 | Where the engine runs | **In the browser tab** (simplest, nothing extra to deploy). A Node headless runner can reuse the same engine later (Phase 6). |
| D5 | Fault → job | A DB trigger on `device_faults` inserts into `jobs` with `source = 'telemetry'` and `error_code`. Both columns already exist. |
| D6 | Job closed → fault cleared | A DB trigger on `jobs` (status → `completed`) resolves the fault, restores device health and resolves the alert. **Automatic.** |
| D7 | Simulated data | Every simulated row is flagged `is_simulated = true`. The page has a **Reset** button. |

> **Why use a key in the URL instead of fully open?** The Supabase anon key is public by design, because it ships inside the app. If the `sim_*` functions needed no secret, anyone who found the project URL could change energy data and create technician jobs. The URL key keeps the "just open a link" experience and blocks that abuse. If you really want it fully open, set `sim_config.require_key = false` (see §6.1).

---

## 4. Architecture

```
┌──────────────── Simulator page (browser, no login) ────────────────┐
│  URL: /?key=DEMO-KEY                                                │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────────┐ │
│  │ Controls │──►│ Engine (tick)│──►│ api.js → supabase.rpc(sim_*)│ │
│  └──────────┘   │ solar, load, │   └──────────────┬──────────────┘ │
│  ┌──────────┐   │ weather,     │                  │                │
│  │ Cards /  │◄──│ faults       │◄── realtime ─────┤ (jobs,         │
│  │ Flow /   │   └──────────────┘    subscriptions │  sim_devices,  │
│  │ Event log│                                     │  device_faults)│
│  └──────────┘                                     │                │
└───────────────────────────────────────────────────┼────────────────┘
                                                    ▼
┌──────────────────────────── Supabase ───────────────────────────────┐
│ NEW: sim_config · sim_devices · device_faults · sim_events          │
│ NEW RPCs: sim_bootstrap · sim_push_tick · sim_inject_fault ·        │
│           sim_clear_fault · sim_backfill · sim_reset · sim_snapshot │
│ NEW triggers: trg_device_fault_job (fault → jobs + alert)           │
│               trg_job_completed_clear_fault (jobs → fault resolved) │
│ EXISTING tables written: energy_metrics · energy_records ·          │
│                          chart_data · alerts · jobs                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼  (existing code, unchanged)
   Member app: Dashboard (energy_metrics/chart_data) · P2P (energy_records → available_kwh)
               Insights/Impact (energy_records) · Fault notice (jobs)
   Admin app:  Alerts (alerts) · Member monitoring (energy_records) · Alert scan
   Technician: Job dashboard (jobs realtime) → accept → repair → close
```

---

## 5. Simulation model

### 5.1 Clock
- **Live mode:** follows real Asia/Colombo time.
- **Demo mode:** the operator drags a time-of-day slider (00:00–23:59), or presses ▶ with a speed setting of 1×, 10×, 60× or 360× (simulated minutes per real minute).
- `recorded_at` is always **real `now()`**, so the app's "today" logic (latest reading per Colombo day) keeps working. The simulated time only drives the sun curve and the load curve.
- Daily totals accumulate per **real** calendar day (Colombo time) and reset at midnight.

### 5.2 Solar production (per household)
```
sun(t)        = max(0, sin(π · (t − 6) / 12)) ^ 1.3          // t = hour of day, sunrise 06:00, sunset 18:00
weather(w)    = sunny 1.00 | partly 0.70±0.15 | cloudy 0.40 | rain 0.15 | storm 0.05 (+ random dips)
healthFactor  = mean(panelHealth[i]) × faultMultiplier
noise         = 1 ± 3 %
production_kW = capacity_kW × sun(t) × weather(w) × healthFactor × noise
```
Each device has `panel_count` panels in `string_count` strings. Panel health (0–1) is stored per panel so the UI can grey out individual panels.

### 5.3 Consumption (per household)
Load profiles, each a 24-hour kW curve plus ±10% noise and multiplied by the operator's load slider (0–200%):

| Profile | Base | Morning peak (06–08) | Evening peak (18–22) |
|---|---|---|---|
| `small` | 0.25 kW | 0.8 kW | 1.5 kW |
| `family` | 0.40 kW | 1.5 kW | 2.5 kW |
| `large` | 0.60 kW | 2.0 kW | 3.8 kW |
| `business` | 0.8 kW (09–17 = 3.0 kW) | — | 1.0 kW |

### 5.4 Derived values per tick
```
surplus_kW  = max(0, production − consumption)
deficit_kW  = max(0, consumption − production)
Δenergy     = kW × simulated hours per tick
daily_production_kWh  += Δprod ; daily_consumption_kWh += Δcons
surplus_kwh (record)   = max(0, daily_production − daily_consumption)   // feeds P2P available_kwh
battery (optional)     : charge from surplus, discharge to cover deficit, clamp 0–100 %
community              : Σ capacity, Σ production, members online, pool shared today
```

### 5.5 Write throttling
| Target | How often |
|---|---|
| `energy_metrics` (upsert per user) | every tick (default 3 s real) |
| `energy_records` (insert, `is_simulated`) | every 10 ticks (~30 s), and immediately on a fault or recovery |
| `chart_data` range `day` (update the current 2-hour slot) | with each `energy_records` write |
| `chart_data` `week` / `month` | at the daily rollover, and from **Backfill** |

All writes for one tick go through **one** `sim_push_tick` call that carries a JSON batch.

---

## 6. Database changes — `supabase/migrations/0011_simulator.sql`

> Number this migration **0011** (or later). Don't reuse 0006: two files already share that number.

### 6.1 New tables
```sql
-- Single-row config
create table public.sim_config (
  id            int primary key default 1 check (id = 1),
  access_key_hash text not null,           -- crypt(key, gen_salt('bf'))
  require_key   boolean not null default true,
  running       boolean not null default false,
  mode          text not null default 'demo' check (mode in ('live','demo')),
  sim_time      time not null default '12:00',
  speed         int  not null default 1,
  weather       text not null default 'sunny'
                check (weather in ('sunny','partly','cloudy','rain','storm')),
  random_faults boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- One virtual inverter per household
create table public.sim_devices (
  id              uuid primary key default gen_random_uuid(),
  household_user_id uuid not null unique references public.profiles(id) on delete cascade,
  inverter_serial text not null,            -- e.g. 'SC-INV-0007'
  capacity_kw     numeric not null default 0,     -- 0 = consumer-only
  panel_count     int not null default 0,
  string_count    int not null default 1,
  panel_health    numeric[] not null default '{}',
  load_profile    text not null default 'family'
                  check (load_profile in ('small','family','large','business')),
  load_factor     numeric not null default 1.0,   -- slider 0–2
  battery_kwh     numeric not null default 0,
  battery_level   numeric not null default 50,
  status          text not null default 'online'
                  check (status in ('online','degraded','fault','offline')),
  active_fault_id uuid,
  updated_at      timestamptz not null default now()
);

-- Fault history (one open fault per device)
create table public.device_faults (
  id             uuid primary key default gen_random_uuid(),
  device_id      uuid not null references public.sim_devices(id) on delete cascade,
  household_user_id uuid not null,
  code           text not null,             -- 'E01' …
  title          text not null,
  severity       text not null check (severity in ('low','medium','high','critical')),
  status         text not null default 'open'
                 check (status in ('open','resolved_by_job','resolved_manual')),
  job_id         uuid references public.jobs(id),
  alert_id       uuid references public.alerts(id),
  details        jsonb not null default '{}',     -- e.g. {"string": 2}
  raised_at      timestamptz not null default now(),
  resolved_at    timestamptz
);
create unique index device_faults_one_open on public.device_faults(device_id) where status = 'open';

-- Event log shown on the page
create table public.sim_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind       text not null,  -- 'fault_raised','job_created','job_accepted','fault_cleared','weather','reset',…
  household_user_id uuid,
  message    text not null,
  data       jsonb not null default '{}'
);
```

### 6.2 Columns added to existing tables
```sql
alter table public.energy_records add column if not exists is_simulated boolean not null default false;
alter table public.energy_metrics add column if not exists is_simulated boolean not null default false;
alter table public.chart_data     add column if not exists is_simulated boolean not null default false;
alter table public.jobs           add column if not exists device_fault_id uuid;
```

### 6.3 Fault catalog (SQL lookup table `sim_fault_codes`, mirrored in `engine/faults.js`)

| Code | Title | Effect in engine | Job urgency | Alert severity | Calm consumer message |
|---|---|---|---|---|---|
| **E01** | Inverter offline | production = 0, status `offline` | urgent | critical | "Your solar system has paused. A technician is on the way — no action needed." |
| **E02** | Panel underperforming (dust/shade) | production × 0.6 | low | low | "Your panels are producing a little less than usual. We've scheduled a check." |
| **E03** | Grid over-voltage trip | production toggles on/off every few ticks | urgent | high | "Your system is protecting itself from a grid issue. A technician will check it." |
| **E04** | Ground / insulation fault | production = 0, safety flag shown | urgent | critical | "For safety, your system has been switched off. Please don't touch the panels; a technician is coming." |
| **E05** | Over-temperature derate | production × 0.7 when sun > 0.6 | medium | medium | "Your inverter is running warm and has slowed down a bit. We'll take a look." |
| **E06** | String disconnected | panels in the chosen string = 0 | medium | high | "Part of your solar array isn't connected. A technician will reconnect it." |
| **E07** | Meter communication lost | **no new readings** for that household (tests the stale-data alert) | medium | medium | "We've lost contact with your meter. A technician will check the connection." |
| **E08** | Arc fault detected | production = 0 | urgent | critical | "Your system detected an electrical issue and shut down safely. Help is on the way." |

### 6.4 RPCs (all `security definer`, `grant execute … to anon`)
Every function starts with `perform public.sim_assert_key(p_key);`, which checks it against `sim_config.access_key_hash` unless `require_key = false`.

| Function | What it does |
|---|---|
| `sim_assert_key(p_key text)` | Raises `42501` when the key is wrong |
| `sim_snapshot(p_key)` | Returns config, devices with household name/role/phone, open faults, linked job status and technician name, and the last 50 events. Used on page load. |
| `sim_bootstrap(p_key)` | Creates a `sim_devices` row for every member profile. Owners get capacity from their profile (default 3–6 kW, 8–14 panels). Consumers get capacity 0. Safe to run again. |
| `sim_update_config(p_key, p_patch jsonb)` | Play/pause, mode, time, speed, weather, random faults |
| `sim_update_device(p_key, p_device_id, p_patch jsonb)` | Capacity, panel count, load profile, load factor, battery |
| `sim_push_tick(p_key, p_batch jsonb)` | Batch upserts into `energy_metrics`, inserts into `energy_records` and updates `chart_data` for many households in one call. Validates numbers (≥ 0, sensible caps). |
| `sim_inject_fault(p_key, p_device_id, p_code, p_details jsonb)` | Inserts into `device_faults`. The trigger does the rest. Returns the fault, job and alert ids. |
| `sim_clear_fault(p_key, p_device_id)` | Manual clear (see §7.3) |
| `sim_backfill(p_key, p_days int)` | Generates the past N days of `energy_records` and `chart_data` week/month, so Insights and Impact have history |
| `sim_reset(p_key, p_scope text)` | `'data'` deletes `is_simulated` rows, resets metrics and closes simulator jobs. `'all'` also deletes devices, faults and events. |

### 6.5 Triggers
```sql
-- A) Fault raised → job + alert + device status
create function public.raise_job_from_device_fault() returns trigger
language plpgsql security definer set search_path = public as $$
declare fc record; p record; v_job uuid; v_alert uuid;
begin
  select * into fc from public.sim_fault_codes where code = new.code;
  select name, mobile_number into p from public.profiles where id = new.household_user_id;

  insert into public.jobs (household_user_id, client_name, client_phone, title,
                           error_code, error_message, urgency, consumer_message,
                           source, device_fault_id)
  values (new.household_user_id, p.name, p.mobile_number, fc.title,
          new.code, fc.technical_message, fc.urgency, fc.consumer_message,
          'telemetry', new.id)
  returning id into v_job;

  insert into public.alerts (title, message, severity, status, source, dedupe_key, …)
  values (fc.code || ' – ' || fc.title || ' at ' || p.name, fc.technical_message,
          fc.severity, 'active', 'system', 'device_fault:' || new.device_id, …)
  returning id into v_alert;

  update public.device_faults set job_id = v_job, alert_id = v_alert where id = new.id;
  update public.sim_devices set status = fc.device_status, active_fault_id = new.id,
         updated_at = now() where id = new.device_id;
  insert into public.sim_events(kind, household_user_id, message, data)
  values ('fault_raised', new.household_user_id, fc.code || ' raised', jsonb_build_object('job_id', v_job));
  return new;
end $$;

create trigger trg_device_fault_job after insert on public.device_faults
for each row execute function public.raise_job_from_device_fault();

-- B) Job completed → fault cleared automatically
create function public.clear_fault_on_job_completed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed'
     and new.device_fault_id is not null then
    update public.device_faults
       set status = 'resolved_by_job', resolved_at = now()
     where id = new.device_fault_id and status = 'open';
    update public.sim_devices d
       set status = 'online', active_fault_id = null,
           panel_health = array_fill(1.0::numeric, array[d.panel_count]), updated_at = now()
     from public.device_faults f
     where f.id = new.device_fault_id and d.id = f.device_id;
    update public.alerts set status = 'resolved'
     where id = (select alert_id from public.device_faults where id = new.device_fault_id);
    insert into public.sim_events(kind, household_user_id, message, data)
    values ('fault_cleared', new.household_user_id,
            'Fault cleared – job closed by ' || coalesce(new.technician_name,'technician'),
            jsonb_build_object('job_id', new.id));
  end if;
  return new;
end $$;

create trigger trg_job_completed_clear_fault after update of status on public.jobs
for each row execute function public.clear_fault_on_job_completed();
```
_(The `alerts` insert columns must match `0002`/`0003`/`0005` exactly. Check them during implementation.)_

### 6.6 Realtime & RLS
- Add `sim_devices`, `device_faults` and `sim_events` to the `supabase_realtime` publication. `jobs` is already in it (0007).
- RLS is enabled on the new tables with **no anon policies**. All access goes through the RPCs. The page reads through `sim_snapshot` plus realtime on `sim_events`, which only carries the event payload; if needed, it re-fetches the snapshot after an event.
  _Alternative if realtime needs SELECT access:_ a read-only anon `select` policy on `sim_events` only. It holds no personal data beyond household names.

---

## 7. End-to-end workflows

### 7.1 Normal energy flow
```
▶ Play → every tick: engine computes production/consumption/surplus for all households
       → sim_push_tick(batch) → energy_metrics / energy_records / chart_data updated
       → Member dashboard shows new numbers (next 30 s poll, or instantly with realtime — §9)
       → P2P "Available Energy" shows providers with surplus (available_kwh reads latest energy_records)
       → Consumer requests energy → owner approves → transaction → available kWh goes down
```

### 7.2 Fault → technician → automatic recovery
```
Operator: house "Perera" → Inject fault ▾ → E01 Inverter offline
  │ sim_inject_fault
  ▼
device_faults (open) ──trigger──► jobs (pending, source=telemetry, error_code=E01, urgency=urgent)
                     ├──────────► alerts (critical, system)
                     └──────────► sim_devices.status = offline → engine sets production 0
  ▼ (realtime, existing code)
Member phone   : dashboard production → 0 ; calm notice "A technician is on the way"
Admin app      : critical alert in Alerts
Technician app : new job in Pending with code E01 + diagnostics dossier
Simulator page : card turns red, shows "Job #… pending"
  ▼
Technician: Accept (→ active) — simulator card shows "🔧 Kamal on the way"
          → Navigate → checklist → photo → Close job (→ completed)
  ▼ trigger trg_job_completed_clear_fault
device_faults resolved_by_job · sim_devices online, health 100 % · alert resolved
Simulator: card turns green; next tick production comes back → Member dashboard recovers
```

### 7.3 Manual clear (operator)
`sim_clear_fault` marks the fault `resolved_manual`, restores the device and resolves the alert.
- If the linked job is still **pending**, it is set to `completed` with the note "Cleared from simulator". The record_job_closure trigger must allow this; check `0010` and use `complete_job_ticket` logic if it needs fields.
- If the job is **active** (a technician has accepted it), the page asks for confirmation first, then does the same.

### 7.4 Random faults (optional toggle)
Each tick, each online producing device has a probability `p` (default 0.2% per tick, adjustable) of getting a random fault, weighted by code: E02 35%, E05 20%, E06 15%, E07 10%, E01 10%, E03 5%, E04 3%, E08 2%.

---

## 8. Simulator page (UI)

### 8.1 Layout
```
┌ Top bar ─────────────────────────────────────────────────────────────────────────────────┐
│ ☀ SolarCoop Simulator   ● Connected   ⚠ SIMULATED DATA   [▶/⏸] Speed[1×|10×|60×|360×]    │
│ Mode: Live | Demo  Time ──●────── 12:30   Weather ☀ ▾   Random faults ○   [Backfill] [Reset]│
├ Community KPIs ──────────────────────────────────────────────────────────────────────────┤
│ Production 18.4 kW │ Consumption 11.2 kW │ Surplus 7.2 kW │ Pool today 23 kWh │ ⛔ 1 fault │ 🔧 1 job │
├ Energy flow (animated SVG) ──────────────────────────────────────────────────────────────┤
│  [Owners] ══▶ (Community pool) ══▶ [Consumers]        Grid ⇄ import/export               │
├ Households (responsive grid of cards) ───────────────────────────────────────────────────┤
│ ┌ 🏠 Perera · Owner · SC-INV-0003 ┐  ┌ 🏠 Silva · Owner ───────────┐  ┌ 🏠 Fernando · Consumer ┐ │
│ │ ▦▦▦▦▦▦ ▦▦▦▦▦▦  (12 panels)       │  │ ▦▦▦▦ ░░░░ (string 2 off)   │  │ 🔌 2.3 kW  ▼ −2.3 kW    │ │
│ │ ☀ 4.2 kW  🔌 1.1  ▲ +3.1 kW      │  │ ⛔ E06 String disconnected  │  │ Load ▬▬●▬ 120 %         │ │
│ │ sparkline ~~~~                   │  │ 🔧 Job pending → Kamal      │  │                         │ │
│ │ Load ▬●▬  Fault ▾  [Edit]        │  │ [Clear fault]               │  │                         │ │
│ └──────────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────┘ │
├ Event log (live) ────────────────────┬ Scenario presets ─────────────────────────────────┤
│ 12:31 E06 raised at Silva → Job #14   │ [Sunny noon] [Evening peak] [Cloudy day] [Storm]  │
│ 12:33 Kamal accepted Job #14          │ [Demo script: fault at house 1 at 12:30]          │
│ 12:41 Job #14 closed → fault cleared  │                                                   │
└───────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### 8.2 Controls
| Control | Effect |
|---|---|
| Play / Pause | Starts or stops the tick loop (`sim_config.running`) |
| Speed | Simulated minutes per real minute |
| Mode Live / Demo | Real clock, or slider/speed |
| Time slider | Jump to any time of day |
| Weather | Global weather factor (a per-house override is optional) |
| Load slider (per house) | 0–200% consumption |
| Edit (per house) | Capacity, panels, strings, profile, battery |
| Fault ▾ (per house) | Pick E01–E08. E06 also asks which string. |
| Clear fault | Manual clear (§7.3) |
| Random faults | On/off plus probability |
| Scenario presets | Set time, weather and loads in one click (and inject a scripted fault) |
| Backfill | Generate 7 or 30 days of history |
| Reset | Wipe simulated data (asks for confirmation) |

### 8.3 States
- **No/invalid key** → a full-page message: "Add `?key=…` to the URL."
- **Disconnected** → a red badge; the loop pauses and retries with backoff.
- **No households** → a "Create virtual inverters" button (`sim_bootstrap`).
- The **tick loop runs only in one tab**. The page claims a short lease in `sim_config` (`leader_tab_id`, `lease_until`), and any other tab becomes a read-only viewer.

---

## 9. Mobile app changes (small, optional but recommended)

| Change | Why | File |
|---|---|---|
| Realtime subscription on `energy_metrics` for the current user (keep the 30 s poll as fallback) | The dashboard reacts instantly during demos instead of up to 30 s late | `src/context/EnergyContext.js`, plus add the table to the realtime publication |
| Show `error_code` and the "Auto-detected" source badge on job cards and job detail | The technician sees "E01 – Inverter offline (auto-detected)" | `src/technician/components/JobCard.js`, `JobTicketDetailScreen.js` |
| Small "Simulated" chip on the dashboard when `energy_metrics.is_simulated` | Honest labelling during demos | `HomeDashboard.js` |
| Add telemetry fault types to the member Alerts Hub copy (EN/SI/TA) | Proper localized text | `src/i18n/locales/*.json` |

No changes are needed for P2P, Insights or Impact, or the Admin alerts. They already read the tables the simulator writes.

---

## 10. Folder structure
```
simulator/
├── index.html                 # page shell, loads supabase-js from CDN (jsdelivr +esm)
├── styles.css
├── config.example.js          # export const SUPABASE_URL = '…'; export const SUPABASE_ANON_KEY = '…';
├── config.js                  # (gitignored copy of the example)
├── src/
│   ├── main.js                # read ?key, sim_snapshot, start UI + realtime + loop
│   ├── api.js                 # thin wrappers around supabase.rpc('sim_*')
│   ├── store.js               # in-memory state + subscribe/notify
│   ├── loop.js                # tick scheduler, write throttling, leader lease, retry
│   ├── engine/
│   │   ├── clock.js           # live/demo time, speed, day rollover (Asia/Colombo)
│   │   ├── solar.js           # sun curve, weather, panel health
│   │   ├── consumption.js     # load profiles
│   │   ├── battery.js         # optional
│   │   ├── faults.js          # E01–E08 catalog + effects (mirrors sim_fault_codes)
│   │   ├── random.js          # seeded PRNG (reproducible demos)
│   │   └── tick.js            # state → per-household readings → push batch
│   └── ui/
│       ├── topbar.js  kpis.js  flow.js  householdCard.js  eventLog.js  presets.js  dialogs.js
└── tests/
    ├── solar.test.mjs  consumption.test.mjs  faults.test.mjs  tick.test.mjs
supabase/migrations/0011_simulator.sql
tests/simulator-database.test.cjs   # PGlite, same pattern as technician-database.test.cjs
```
`package.json` scripts:
```json
"sim": "npx serve simulator -l 5050",
"test:sim": "node --test simulator/tests/*.test.mjs tests/simulator-database.test.cjs"
```
Local URL: `http://localhost:5050/?key=<demo-key>`

---

## 11. Hosting & configuration
1. Apply `0011_simulator.sql` in the Supabase SQL editor. Then set the key: `select public.sim_set_key('<choose-a-demo-key>');` (an admin-only helper that stores the bcrypt hash).
2. Copy `simulator/config.example.js` to `config.js` and fill in the **same** project URL and **anon** key the app uses. **Never put the `service_role` key in the page.**
3. Run locally with `npm run sim`, or deploy the `simulator/` folder to any static host (Netlify drop, Vercel, GitHub Pages).
4. Share `https://<host>/?key=<demo-key>`.

---

## 12. Testing plan
| Level | What | How |
|---|---|---|
| Unit | Sun curve (0 at night, peak at noon), weather factors, load profiles, fault effects (E01 = 0, E06 string = 0, E07 = no reading), daily accumulation, rollover | `node:test` in `simulator/tests` |
| DB | Wrong key rejected · `sim_push_tick` writes rows with `is_simulated` · **inject fault → job (telemetry, error_code) + alert + device offline** · **job completed → fault resolved, device online, alert resolved** · one open fault per device · reset deletes only simulated rows | PGlite test `tests/simulator-database.test.cjs` |
| Integration | P2P available kWh follows the simulated surplus · Admin stale-data alert fires after E07 · Insights and Impact show backfilled history | Manual checklist on Expo web plus a phone |
| Demo rehearsal | Full script (§13), run twice from a clean reset | Team |

---

## 13. Demo script (≈ 6 minutes)
1. **Reset**, then **Backfill 7 days**, then preset **Sunny noon** and ▶ at 60×.
2. Phones: the member dashboard numbers climb and the Insights screen shows a week of history.
3. Consumer phone: **P2P → Available Energy** shows Perera with a surplus. Send a request; Perera approves; the transaction appears.
4. Simulator: inject **E01** at Perera. The card turns red.
5. Perera's phone: production drops to 0 and the calm "technician on the way" notice appears. Admin: a **critical alert**. Technician: a **new E01 job** appears instantly.
6. Technician: accept, navigate, tick the checklist, take a photo, **close the job**.
7. Simulator: the event log shows "fault cleared" and the card turns green. Perera's dashboard production recovers.
8. Preset **Evening peak**: surpluses turn into deficits, which shows the community balance.

---

## 14. Phased delivery

| Phase | Scope | Est. |
|---|---|---|
| **1 – DB foundation** | `0011_simulator.sql`: tables, fault codes, key check, `sim_snapshot`, `sim_bootstrap`, `sim_push_tick`, `sim_reset`, plus the PGlite tests | 1–1.5 days |
| **2 – Engine** | clock, solar, consumption, faults, tick, with unit tests | 1 day |
| **3 – Page MVP** | key gate, top bar, household cards, play/pause, time and weather, live writes | 1.5 days |
| **4 – Fault loop** | `sim_inject_fault`, both triggers, `sim_clear_fault`, realtime job status on cards, event log, DB tests for the loop | 1–1.5 days |
| **5 – Polish** | energy-flow SVG, KPIs, presets, backfill, random faults, leader lease, responsive layout | 1.5 days |
| **6 – App tweaks + optional headless** | realtime on `energy_metrics`, error code on job cards, Simulated chip, i18n; optional `node simulator/headless.mjs` runner | 1 day |
| **7 – Rehearsal** | integration checklist, demo script ×2, fixes | 0.5 day |

**Total ≈ 8–9 dev-days** (it can run in parallel: DB + engine, then page).

---

## 15. Suggested Jira breakdown — "Epic 10 – Energy & Fault Simulator"
| Story | Acceptance criteria (short) |
|---|---|
| Simulator DB schema & secure RPCs | Tables, fault codes, key-checked RPCs; wrong key rejected; PGlite tests pass |
| Virtual inverter engine | Production/consumption follow time, weather and load; unit tests pass |
| Simulator control page (no login, URL key) | Opens via `?key=`, lists every household, play/pause/time/weather/load work |
| Live data feed to app tables | Dashboard, P2P available kWh and Insights change with the simulation |
| Fault injection with error codes E01–E08 | Each code has its documented effect; card shows the fault |
| Automatic fault → technician job | Job created with `source=telemetry` and `error_code`; alert raised; member notified |
| Automatic fault clear on job close | Closing the job resolves the fault and alert; production recovers |
| Energy-flow visualisation & presets | Animated flow, KPIs, scenario presets, backfill |
| Mobile app realtime + telemetry display | Dashboard updates instantly; job shows code and "auto-detected" |
| Simulator demo rehearsal | Demo script runs end to end twice from reset |

---

## 16. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Anyone with the link can control the simulation | Demo key in the URL; rotate with `sim_set_key`; use a separate demo Supabase project if possible |
| Simulated rows mix with real data | `is_simulated` flag on every row, Reset, "SIMULATED DATA" badges. Also clean up the old synthetic readings (IDs 10–18). |
| Dashboard lags because of the 30 s polling | Realtime on `energy_metrics` (Phase 6) |
| `energy_records` grows fast at high speed | Throttle (§5.5); Reset; optional cap per user |
| Job closure trigger in `0010` needs extra fields for a manual clear | Check during Phase 4; route the manual clear through `complete_job_ticket` |
| Browser tab closed, so the simulation stops | Leader lease plus Resume; optional headless runner (Phase 6) |
| Migration number clash (two `0006` files) | Use `0011`; fix the numbering separately |

---

## 17. Open questions
1. Use the **existing** Supabase project, or a separate demo project? A separate one is safer.
2. Which households: every profile, or only a chosen demo set (e.g. 6 houses)?
3. Should the **battery** be simulated? `energy_metrics` already has battery fields.
4. Should random faults be **off by default**? Recommended, so demos stay predictable.
