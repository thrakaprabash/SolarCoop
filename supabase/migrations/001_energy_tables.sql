-- =============================================================================
-- SolarCoop - Energy Data Tables
-- Migration: 001_energy_tables.sql
--
-- Run this in the Supabase dashboard -> SQL Editor.
--
-- Tables created:
--   energy_metrics   - live snapshot per member (one row, upserted on refresh)
--   energy_history   - append-only transaction log per member
--   appliances       - per-member device list + active state
--   chart_data       - hourly time-series arrays per member per range
--
-- All tables use Row Level Security (RLS) so each authenticated member can
-- only read and write their own rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. energy_metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_metrics (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at             timestamptz NOT NULL DEFAULT now(),

  instant_production     numeric     NOT NULL DEFAULT 8.5,
  daily_production       numeric     NOT NULL DEFAULT 42.6,
  instant_consumption    numeric     NOT NULL DEFAULT 3.8,
  daily_consumption      numeric     NOT NULL DEFAULT 24.1,

  battery_level          integer     NOT NULL DEFAULT 88,
  battery_capacity       numeric     NOT NULL DEFAULT 13.5,
  battery_power_flow     numeric     NOT NULL DEFAULT 2.1,

  surplus_available      numeric     NOT NULL DEFAULT 4.6,
  coop_pool_shared_today numeric     NOT NULL DEFAULT 18.5,
  coop_tokens_earned     numeric     NOT NULL DEFAULT 142.5,
  monetary_saved         numeric     NOT NULL DEFAULT 38.40,
  co2_saved_kg           numeric     NOT NULL DEFAULT 34.2,
  grid_independence      integer     NOT NULL DEFAULT 94,
  coop_members_online    integer     NOT NULL DEFAULT 14,
  coop_total_capacity    numeric     NOT NULL DEFAULT 120.0,

  CONSTRAINT energy_metrics_user_unique UNIQUE (user_id)
);

ALTER TABLE public.energy_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "energy_metrics_member_own"
  ON public.energy_metrics
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. energy_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  type       text        NOT NULL,
  title      text        NOT NULL,
  amount     text        NOT NULL,
  cost       text,
  status     text,
  detail     text
);

CREATE INDEX IF NOT EXISTS energy_history_user_time_idx
  ON public.energy_history (user_id, created_at DESC);

ALTER TABLE public.energy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "energy_history_member_own"
  ON public.energy_history
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. appliances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appliances (
  id       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name     text    NOT NULL,
  power    text    NOT NULL,
  active   boolean NOT NULL DEFAULT true,
  icon     text,
  category text
);

ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appliances_member_own"
  ON public.appliances
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. chart_data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chart_data (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  range       text        NOT NULL DEFAULT 'day',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  hours       text[]      NOT NULL DEFAULT '{}',
  production  numeric[]   NOT NULL DEFAULT '{}',
  consumption numeric[]   NOT NULL DEFAULT '{}',
  surplus     numeric[]   NOT NULL DEFAULT '{}',
  deficit     numeric[]   NOT NULL DEFAULT '{}',

  CONSTRAINT chart_data_user_range_unique UNIQUE (user_id, range)
);

ALTER TABLE public.chart_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chart_data_member_own"
  ON public.chart_data
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- SEED DATA (safe to run multiple times - idempotent)
-- =============================================================================

-- Seed energy_metrics (one row per existing user)
INSERT INTO public.energy_metrics (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Seed day chart_data
INSERT INTO public.chart_data (user_id, range, hours, production, consumption, surplus, deficit)
SELECT
  id,
  'day',
  ARRAY['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'],
  ARRAY[0.5, 2.8, 6.4, 8.8, 8.2, 5.1, 1.2, 0.0],
  ARRAY[1.8, 3.2, 3.8, 4.1, 3.5, 4.8, 6.2, 4.5],
  ARRAY[0.0, 0.0, 2.6, 4.7, 4.7, 0.3, 0.0, 0.0],
  ARRAY[1.3, 0.4, 0.0, 0.0, 0.0, 0.0, 5.0, 4.5]
FROM auth.users
ON CONFLICT (user_id, range) DO NOTHING;

-- Seed week chart_data
INSERT INTO public.chart_data (user_id, range, hours, production, consumption, surplus, deficit)
SELECT
  id,
  'week',
  ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  ARRAY[38.2, 41.5, 44.1, 48.6, 42.3, 36.8, 39.4],
  ARRAY[22.1, 24.8, 23.5, 25.2, 26.1, 20.3, 21.7],
  ARRAY[16.1, 16.7, 20.6, 23.4, 16.2, 16.5, 17.7],
  ARRAY[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
FROM auth.users
ON CONFLICT (user_id, range) DO NOTHING;

-- Seed month chart_data
INSERT INTO public.chart_data (user_id, range, hours, production, consumption, surplus, deficit)
SELECT
  id,
  'month',
  ARRAY['W1','W2','W3','W4'],
  ARRAY[280.5, 302.1, 315.8, 290.3],
  ARRAY[168.2, 175.6, 182.1, 170.4],
  ARRAY[112.3, 126.5, 133.7, 119.9],
  ARRAY[0.0, 0.0, 0.0, 0.0]
FROM auth.users
ON CONFLICT (user_id, range) DO NOTHING;

-- Seed default appliances for every existing user
INSERT INTO public.appliances (user_id, name, power, active, icon, category)
SELECT u.id, a.name, a.power, a.active, a.icon, a.category
FROM auth.users u
CROSS JOIN (
  VALUES
    ('HVAC Air Conditioner',       '2.4 kW', true,  'wind',    'Climate'),
    ('EV Charger (Tesla Wallbox)', '7.2 kW', true,  'zap',     'Mobility'),
    ('Smart Washer / Dryer',       '1.2 kW', false, 'repeat',  'Laundry'),
    ('Water Heater HeatPump',      '1.8 kW', true,  'droplet', 'Water'),
    ('Refrigerator and Freezers',  '0.35 kW',true,  'box',     'Kitchen'),
    ('Home Entertainment and IT',  '0.45 kW',true,  'tv',      'Electronics')
) AS a(name, power, active, icon, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.appliances WHERE user_id = u.id LIMIT 1
);