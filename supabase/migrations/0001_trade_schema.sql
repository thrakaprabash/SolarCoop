-- SolarCoop — Trade & Energy backend schema (SOL-104, SOL-105, and later
-- SOL-106..109, SOL-136/137). Apply via the Supabase SQL Editor.

-- ── profiles: three new display-only columns (existing table) ──────────────
-- Not real pricing/IoT/geolocation — simple stored, seeded values so the
-- existing Sprint 1 UI (rate, battery SoC, distance) keeps rendering.
alter table public.profiles
  add column if not exists rate_per_kwh numeric(4,2) default 0.22,
  add column if not exists battery_soc smallint default 80,
  add column if not exists distance_label text default '120 m';

-- ── energy_records: daily production/consumption per member ────────────────
-- Shared with Tharaka's dashboard backend (SOL-96/SOL-102) — do not rename.
create table public.energy_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  record_date date not null default current_date,
  production numeric not null default 0,
  consumption numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, record_date)
);

alter table public.energy_records enable row level security;

create policy "energy_records are readable by any signed-in member"
  on public.energy_records for select
  using (auth.role() = 'authenticated');

create policy "members can write their own energy_records"
  on public.energy_records for insert
  with check (auth.uid() = user_id);

create policy "members can update their own energy_records"
  on public.energy_records for update
  using (auth.uid() = user_id);

-- ── energy_requests ──────────────────────────────────────────────────────
create table public.energy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  requested_amount numeric not null check (requested_amount > 0),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.energy_requests enable row level security;

create policy "requester or provider can read a request"
  on public.energy_requests for select
  using (auth.uid() = requester_id or auth.uid() = provider_id);

create policy "a member can create their own request"
  on public.energy_requests for insert
  with check (auth.uid() = requester_id);

create policy "the provider can update a request they own"
  on public.energy_requests for update
  using (auth.uid() = provider_id);

-- ── transactions ─────────────────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.energy_requests(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  energy_amount numeric not null check (energy_amount > 0),
  status text not null default 'COMPLETED' check (status in ('COMPLETED', 'REVERSED')),
  reference_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "sender or receiver can read a transaction"
  on public.transactions for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "the sender can create a transaction for their own approval"
  on public.transactions for insert
  with check (auth.uid() = sender_id);
