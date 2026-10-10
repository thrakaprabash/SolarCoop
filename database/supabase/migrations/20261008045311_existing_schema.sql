SET local check_function_bodies = off;

CREATE SCHEMA "simulator_private";

CREATE SCHEMA "trade_private";

CREATE SEQUENCE "public"."jobs_ticket_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1001 CACHE 1 NO CYCLE;

CREATE TABLE "public"."alerts" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "alert_type"   text                     NOT NULL,
  "user_id"      uuid,
  "message"      text                     NOT NULL,
  "severity"     text                     NOT NULL DEFAULT 'medium'::text,
  "status"       text                     NOT NULL DEFAULT 'active'::text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "source"       text                     NOT NULL DEFAULT 'admin'::text,
  "dedupe_key"   text,
  "is_simulated" boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "alerts_pkey" PRIMARY KEY (id),
  CONSTRAINT "alerts_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT "alerts_source_check" CHECK ((source = ANY (ARRAY['admin'::text, 'system'::text]))),
  CONSTRAINT "alerts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'resolved'::text, 'dismissed'::text])))
);

ALTER TABLE "public"."alerts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."appliances" (
  "id"       uuid    NOT NULL DEFAULT gen_random_uuid(),
  "user_id"  uuid    NOT NULL,
  "name"     text    NOT NULL,
  "power"    text    NOT NULL,
  "active"   boolean NOT NULL DEFAULT true,
  "icon"     text,
  "category" text,
  CONSTRAINT "appliances_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."appliances"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chart_data" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "range"        text                     NOT NULL DEFAULT 'day'::text,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "hours"        text[]                   NOT NULL DEFAULT '{}'::text[],
  "production"   numeric[]                NOT NULL DEFAULT '{}'::numeric[],
  "consumption"  numeric[]                NOT NULL DEFAULT '{}'::numeric[],
  "surplus"      numeric[]                NOT NULL DEFAULT '{}'::numeric[],
  "deficit"      numeric[]                NOT NULL DEFAULT '{}'::numeric[],
  "is_simulated" boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "chart_data_pkey" PRIMARY KEY (id),
  CONSTRAINT "chart_data_user_range_unique" UNIQUE (user_id, RANGE)
);

ALTER TABLE "public"."chart_data"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."complaints" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"             uuid                     NOT NULL,
  "type"                text                     NOT NULL,
  "description"         text                     NOT NULL,
  "related_transaction" text,
  "status"              text                     NOT NULL DEFAULT 'open'::text,
  "resolution_note"     text,
  "submitted_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "complaints_pkey" PRIMARY KEY (id),
  CONSTRAINT "complaints_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'under_review'::text, 'investigated'::text, 'resolved'::text, 'rejected'::text])))
);

ALTER TABLE "public"."complaints"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."device_faults" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "device_id"         uuid                     NOT NULL,
  "household_user_id" uuid                     NOT NULL,
  "code"              text                     NOT NULL,
  "title"             text                     NOT NULL,
  "severity"          text                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'open'::text,
  "job_id"            uuid,
  "alert_id"          uuid,
  "details"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "raised_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at"       timestamp with time zone,
  CONSTRAINT "device_faults_pkey" PRIMARY KEY (id),
  CONSTRAINT "device_faults_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT "device_faults_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'resolved_by_job'::text, 'resolved_manual'::text])))
);

ALTER TABLE "public"."device_faults"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."device_faults" FROM "anon", "authenticated";

CREATE TABLE "public"."energy_history" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "type"       text                     NOT NULL,
  "title"      text                     NOT NULL,
  "amount"     text                     NOT NULL,
  "cost"       text,
  "status"     text,
  "detail"     text,
  CONSTRAINT "energy_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."energy_history"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."energy_metrics" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                uuid                     NOT NULL,
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "instant_production"     numeric                  NOT NULL DEFAULT 8.5,
  "daily_production"       numeric                  NOT NULL DEFAULT 42.6,
  "instant_consumption"    numeric                  NOT NULL DEFAULT 3.8,
  "daily_consumption"      numeric                  NOT NULL DEFAULT 24.1,
  "battery_level"          integer                  NOT NULL DEFAULT 88,
  "battery_capacity"       numeric                  NOT NULL DEFAULT 13.5,
  "battery_power_flow"     numeric                  NOT NULL DEFAULT 2.1,
  "surplus_available"      numeric                  NOT NULL DEFAULT 4.6,
  "coop_pool_shared_today" numeric                  NOT NULL DEFAULT 18.5,
  "coop_tokens_earned"     numeric                  NOT NULL DEFAULT 142.5,
  "monetary_saved"         numeric                  NOT NULL DEFAULT 38.40,
  "co2_saved_kg"           numeric                  NOT NULL DEFAULT 34.2,
  "grid_independence"      integer                  NOT NULL DEFAULT 94,
  "coop_members_online"    integer                  NOT NULL DEFAULT 14,
  "coop_total_capacity"    numeric                  NOT NULL DEFAULT 120.0,
  "is_simulated"           boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "energy_metrics_pkey" PRIMARY KEY (id),
  CONSTRAINT "energy_metrics_user_unique" UNIQUE (user_id)
);

ALTER TABLE "public"."energy_metrics"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."energy_records" (
  "id"              bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "production_kwh"  numeric                  NOT NULL DEFAULT 0,
  "consumption_kwh" numeric                  NOT NULL DEFAULT 0,
  "recorded_at"     timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "is_simulated"    boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "energy_records_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."energy_records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."energy_requests" (
  "id"                   bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "requester_id"         uuid                     NOT NULL,
  "provider_id"          uuid                     NOT NULL,
  "amount_requested_kwh" numeric                  NOT NULL,
  "status"               text                     DEFAULT 'PENDING'::text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "energy_requests_amount_requested_kwh_check" CHECK ((amount_requested_kwh > (0)::numeric)),
  CONSTRAINT "energy_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "energy_requests_status_check" CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'COMPLETED'::text])))
);

ALTER TABLE "public"."energy_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."jobs" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "ticket_code"          text                     NOT NULL DEFAULT ('JOB-'::text || (nextval('public.jobs_ticket_seq'::regclass))::text),
  "household_user_id"    uuid,
  "client_name"          text,
  "client_phone"         text,
  "site_address"         text,
  "site_area"            text,
  "distance_km"          numeric(5,1),
  "title"                text                     NOT NULL,
  "device"               text,
  "error_code"           text,
  "error_message"        text,
  "fault_location"       text,
  "urgency"              text                     NOT NULL DEFAULT 'medium'::text,
  "diagnostic_checklist" jsonb
    NOT NULL DEFAULT '[{"done": false, "label": "Test DC voltage"}, {"done": false, "label": "Inspect MC4 joints"}, {"done": false, "label": "Check isolator switch"}]'::jsonb,
  "consumer_message"     text,
  "status"               text                     NOT NULL DEFAULT 'pending'::text,
  "technician_id"        uuid,
  "technician_name"      text,
  "resolution_notes"     text,
  "source"               text                     NOT NULL DEFAULT 'manual'::text,
  "complaint_id"         uuid,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "accepted_at"          timestamp with time zone,
  "completed_at"         timestamp with time zone,
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "repair_photos"        jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "closure_record"       jsonb,
  "device_fault_id"      uuid,
  "is_simulated"         boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "jobs_closure_record_check" CHECK (((closure_record IS NULL) OR (jsonb_typeof(closure_record) = 'object'::text))),
  CONSTRAINT "jobs_pkey" PRIMARY KEY (id),
  CONSTRAINT "jobs_repair_photos_check" CHECK ((jsonb_typeof(repair_photos) = 'array'::text)),
  CONSTRAINT "jobs_source_check" CHECK ((source = ANY (ARRAY['complaint'::text, 'telemetry'::text, 'manual'::text]))),
  CONSTRAINT "jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text]))),
  CONSTRAINT "jobs_ticket_code_key" UNIQUE (ticket_code),
  CONSTRAINT "jobs_urgency_check" CHECK ((urgency = ANY (ARRAY['urgent'::text, 'medium'::text, 'low'::text])))
);

ALTER TABLE "public"."jobs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                uuid                     NOT NULL,
  "name"              text                     NOT NULL,
  "role"              text                     NOT NULL DEFAULT 'consumer'::text,
  "household_id"      text,
  "solar_capacity_kw" numeric                  DEFAULT 0,
  "status"            text                     DEFAULT 'active'::text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "mobile_number"     text,
  "rate_per_kwh"      numeric(4,2)             DEFAULT 0.22,
  "battery_soc"       smallint                 DEFAULT 80,
  "distance_label"    text                     DEFAULT '120 m'::text,
  CONSTRAINT "profiles_household_id_key" UNIQUE (household_id),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'consumer'::text, 'technician'::text, 'admin'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sim_config" (
  "id"                integer                  NOT NULL DEFAULT 1,
  "access_key_hash"   text                     NOT NULL DEFAULT ''::text,
  "require_key"       boolean                  NOT NULL DEFAULT true,
  "running"           boolean                  NOT NULL DEFAULT false,
  "mode"              text                     NOT NULL DEFAULT 'demo'::text,
  "sim_time"          time without time zone   NOT NULL DEFAULT '12:00:00'::time WITHOUT time zone,
  "speed"             integer                  NOT NULL DEFAULT 1,
  "weather"           text                     NOT NULL DEFAULT 'sunny'::text,
  "random_faults"     boolean                  NOT NULL DEFAULT false,
  "fault_probability" numeric                  NOT NULL DEFAULT 0.002,
  "leader_tab_id"     uuid,
  "lease_until"       timestamp with time zone,
  "last_tick_id"      uuid,
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sim_config_fault_probability_check" CHECK (((fault_probability >= (0)::numeric) AND (fault_probability <= 0.1))),
  CONSTRAINT "sim_config_id_check" CHECK ((id = 1)),
  CONSTRAINT "sim_config_mode_check" CHECK ((mode = ANY (ARRAY['live'::text, 'demo'::text]))),
  CONSTRAINT "sim_config_pkey" PRIMARY KEY (id),
  CONSTRAINT "sim_config_speed_check" CHECK ((speed = ANY (ARRAY[1, 10, 60, 360]))),
  CONSTRAINT "sim_config_weather_check" CHECK ((weather = ANY (ARRAY['sunny'::text, 'partly'::text, 'cloudy'::text, 'rain'::text, 'storm'::text])))
);

ALTER TABLE "public"."sim_config"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sim_config" FROM "anon", "authenticated";

CREATE TABLE "public"."sim_devices" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "household_user_id" uuid                     NOT NULL,
  "inverter_serial"   text                     NOT NULL,
  "capacity_kw"       numeric                  NOT NULL DEFAULT 0,
  "panel_count"       integer                  NOT NULL DEFAULT 0,
  "string_count"      integer                  NOT NULL DEFAULT 1,
  "panel_health"      numeric[]                NOT NULL DEFAULT '{}'::numeric[],
  "load_profile"      text                     NOT NULL DEFAULT 'family'::text,
  "load_factor"       numeric                  NOT NULL DEFAULT 1,
  "battery_kwh"       numeric                  NOT NULL DEFAULT 0,
  "battery_level"     numeric                  NOT NULL DEFAULT 50,
  "status"            text                     NOT NULL DEFAULT 'online'::text,
  "active_fault_id"   uuid,
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sim_devices_battery_kwh_check" CHECK (((battery_kwh >= (0)::numeric) AND (battery_kwh <= (200)::numeric))),
  CONSTRAINT "sim_devices_battery_level_check" CHECK (((battery_level >= (0)::numeric) AND (battery_level <= (100)::numeric))),
  CONSTRAINT "sim_devices_capacity_kw_check" CHECK (((capacity_kw >= (0)::numeric) AND (capacity_kw <= (100)::numeric))),
  CONSTRAINT "sim_devices_household_user_id_key" UNIQUE (household_user_id),
  CONSTRAINT "sim_devices_load_factor_check" CHECK (((load_factor >= (0)::numeric) AND (load_factor <= (2)::numeric))),
  CONSTRAINT "sim_devices_load_profile_check" CHECK ((load_profile = ANY (ARRAY['small'::text, 'family'::text, 'large'::text, 'business'::text]))),
  CONSTRAINT "sim_devices_panel_count_check" CHECK (((panel_count >= 0) AND (panel_count <= 200))),
  CONSTRAINT "sim_devices_pkey" PRIMARY KEY (id),
  CONSTRAINT "sim_devices_status_check" CHECK ((status = ANY (ARRAY['online'::text, 'degraded'::text, 'fault'::text, 'offline'::text]))),
  CONSTRAINT "sim_devices_string_count_check" CHECK (((string_count >= 1) AND (string_count <= 20)))
);

ALTER TABLE "public"."sim_devices"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sim_devices" FROM "anon", "authenticated";

CREATE TABLE "public"."sim_events" (
  "id"                bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "kind"              text                     NOT NULL,
  "household_user_id" uuid,
  "message"           text                     NOT NULL,
  "data"              jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "sim_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sim_events"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sim_events" FROM "anon", "authenticated";

CREATE TABLE "public"."sim_fault_codes" (
  "code"              text NOT NULL,
  "title"             text NOT NULL,
  "technical_message" text NOT NULL,
  "urgency"           text NOT NULL,
  "severity"          text NOT NULL,
  "device_status"     text NOT NULL,
  "consumer_message"  text NOT NULL,
  CONSTRAINT "sim_fault_codes_pkey" PRIMARY KEY (code)
);

ALTER TABLE "public"."sim_fault_codes"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sim_fault_codes" FROM "anon", "authenticated";

CREATE TABLE "public"."transactions" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "request_id"     bigint,
  "sender_id"      uuid                     NOT NULL,
  "receiver_id"    uuid                     NOT NULL,
  "energy_amount"  numeric                  NOT NULL,
  "status"         text                     NOT NULL DEFAULT 'COMPLETED'::text,
  "reference_code" text                     NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_energy_amount_check" CHECK ((energy_amount > (0)::numeric)),
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id),
  CONSTRAINT "transactions_reference_code_key" UNIQUE (reference_code),
  CONSTRAINT "transactions_status_check" CHECK ((status = ANY (ARRAY['COMPLETED'::text, 'REVERSED'::text])))
);

ALTER TABLE "public"."transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "simulator_private"."operator_closures" (
  "job_id"         uuid   NOT NULL,
  "transaction_id" bigint NOT NULL,
  CONSTRAINT "operator_closures_pkey" PRIMARY KEY (job_id)
);

ALTER TABLE "simulator_private"."operator_closures"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "simulator_private"."original_rows" (
  "table_name" text  NOT NULL,
  "row_key"    text  NOT NULL,
  "value"      jsonb NOT NULL,
  CONSTRAINT "original_rows_pkey" PRIMARY KEY (table_name, row_key)
);

ALTER TABLE "simulator_private"."original_rows"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."energy_records"
  ADD COLUMN "surplus_kwh" numeric GENERATED ALWAYS AS (GREATEST((0)::numeric, (production_kwh - consumption_kwh))) STORED;

CREATE OR REPLACE FUNCTION public.attach_job_repair_photo (
  p_job_id uuid,
  p_path   text
)
  RETURNS public.jobs
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_job public.jobs;
  v_object storage.objects;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id
     or v_job.status <> 'active' then
    raise exception 'Only the assigned technician can add photos to an active job.';
  end if;
  select * into v_object from storage.objects
    where bucket_id = 'repair-evidence' and name = p_path;
  if not found or split_part(p_path, '/', 1) <> p_job_id::text
     or coalesce(v_object.metadata->>'mimetype', '') not in ('image/jpeg', 'image/png')
     or coalesce((v_object.metadata->>'size')::bigint, 0) not between 1 and 10485760 then
    raise exception 'Upload a JPG or PNG photo up to 10 MB for this job first.';
  end if;
  -- Row lock and deduplication make retries and concurrent uploads safe.
  if not exists (select 1 from jsonb_array_elements(v_job.repair_photos) p where p->>'path' = p_path) then
    update public.jobs set repair_photos = repair_photos || jsonb_build_array(jsonb_build_object(
      'path', p_path, 'contentType', v_object.metadata->>'mimetype',
      'size', (v_object.metadata->>'size')::bigint, 'uploadedAt', now(), 'uploadedBy', auth.uid()
    )) where id = p_job_id returning * into v_job;
  end if;
  return v_job;
end;
$function$;

CREATE OR REPLACE FUNCTION public.clear_fault_on_job_completed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare f public.device_faults;
begin
  if new.device_fault_id is null then return new; end if;
  if new.status='active' and old.status is distinct from 'active' then
    insert into public.sim_events(kind,household_user_id,message,data) values('job_accepted',new.household_user_id,coalesce(new.technician_name,'Technician')||' accepted '||new.ticket_code,jsonb_build_object('job_id',new.id));
  elsif new.status='completed' and old.status is distinct from 'completed' then
    update public.device_faults set status=case when exists(select 1 from simulator_private.operator_closures where job_id=new.id and transaction_id=txid_current()) then 'resolved_manual' else 'resolved_by_job' end,resolved_at=now()
      where id=new.device_fault_id and status='open' returning * into f;
    if found then
      update public.sim_devices set status='online',active_fault_id=null,panel_health=array_fill(1::numeric,array[panel_count]),updated_at=now() where id=f.device_id and active_fault_id=f.id;
      update public.alerts set status='resolved' where id=f.alert_id;
      insert into public.sim_events(kind,household_user_id,message,data) values('fault_cleared',new.household_user_id,'Fault cleared — '||new.ticket_code||' completed',jsonb_build_object('job_id',new.id));
    end if;
  end if;
  return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."clear_fault_on_job_completed"() FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.complete_job_ticket (
  p_job_id uuid,
  p_notes  text
)
  RETURNS public.jobs
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id then
    raise exception 'Only the assigned technician can close this job.';
  end if;
  -- A lost response can be retried without duplicating or changing the closure record.
  if v_job.status = 'completed' and v_job.closure_record is not null then
    return v_job;
  end if;
  if v_job.status <> 'active' then
    raise exception 'This job is no longer active.';
  end if;
  update public.jobs set status = 'completed', resolution_notes = p_notes
    where id = p_job_id returning * into v_job;
  return v_job;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select role from public.profiles where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, role, mobile_number, household_id, solar_capacity_kw, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Co-op Member'),
    COALESCE(new.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(new.raw_user_meta_data->>'mobileNumber', new.raw_user_meta_data->>'mobile_number'), -- Supports both casings
    COALESCE(new.raw_user_meta_data->>'household_id', 'HH-' || substring(md5(random()::text) from 1 for 6)),
    COALESCE((new.raw_user_meta_data->>'solar_capacity_kw')::numeric, 0),
    'active'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_technician()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'technician'
  );
$function$;

CREATE OR REPLACE FUNCTION public.raise_complaint_alert()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  member_name      text;
  member_household text;
  who              text;
  sev              text;
begin
  select name, household_id into member_name, member_household
  from public.profiles where id = new.user_id;

  who := coalesce(member_name, 'A member')
         || case when member_household is not null
                 then ' (' || member_household || ')'
                 else '' end;

  -- Problems with the system or a trade are more pressing than the rest.
  sev := case new.type
    when 'Transaction Error' then 'medium'
    when 'System Fault'      then 'medium'
    else 'low'
  end;

  insert into public.alerts (alert_type, user_id, message, severity, source)
  values (
    'complaint_new',
    new.user_id,
    who || ' filed a ' || coalesce(new.type, 'new') || ' complaint.',
    sev,
    'system'
  );

  return new;
exception
  when others then
    raise warning 'raise_complaint_alert failed: %', sqlerrm;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.raise_job_from_complaint()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  member_name  text;
  member_phone text;
begin
  select name, mobile_number into member_name, member_phone
  from public.profiles where id = new.user_id;

  insert into public.jobs (
    household_user_id, client_name, client_phone,
    title, error_message, urgency, consumer_message,
    source, complaint_id
  ) values (
    new.user_id,
    member_name,
    member_phone,
    'Reported System Fault',
    left(coalesce(new.description, ''), 240),
    'medium',
    'We received your report and a technician will check your system shortly. There is nothing you need to do.',
    'complaint',
    new.id
  );

  return new;
exception
  when others then
    -- Never block the complaint itself because dispatch failed.
    raise warning 'raise_job_from_complaint failed: %', sqlerrm;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.raise_job_from_device_fault()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare fc public.sim_fault_codes; p public.profiles; d public.sim_devices; j uuid; a uuid;
begin
  select * into strict fc from public.sim_fault_codes where code=new.code;
  select * into strict p from public.profiles where id=new.household_user_id;
  select * into strict d from public.sim_devices where id=new.device_id;
  insert into public.jobs(household_user_id,client_name,client_phone,title,device,error_code,error_message,urgency,consumer_message,source,device_fault_id,is_simulated,fault_location)
    values(p.id,p.name,p.mobile_number,fc.title,d.inverter_serial,fc.code,fc.technical_message,fc.urgency,fc.consumer_message,'telemetry',new.id,true,
      case when new.code='E06' then 'String '||(new.details->>'string') else 'Virtual inverter' end) returning id into j;
  insert into public.alerts(alert_type,user_id,message,severity,status,source,dedupe_key,is_simulated)
    values('device_fault',p.id,fc.code||' — '||fc.title||' at '||coalesce(p.name,'household')||'. '||fc.technical_message,fc.severity,'active','system','device_fault:'||d.id,true) returning id into a;
  update public.device_faults set job_id=j,alert_id=a where id=new.id;
  update public.sim_devices set status=fc.device_status,active_fault_id=new.id,updated_at=now(),
    panel_health=case when new.code='E06' then array(select case when floor((i-1)::numeric*string_count/panel_count)+1=(new.details->>'string')::int then 0 else panel_health[i] end from generate_series(1,panel_count) i) else panel_health end where id=d.id;
  insert into public.sim_events(kind,household_user_id,message,data) values
    ('fault_raised',p.id,fc.code||' raised at '||coalesce(p.name,'household'),jsonb_build_object('job_id',j,'fault_id',new.id)),
    ('job_created',p.id,'Technician job created',jsonb_build_object('job_id',j));
  return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."raise_job_from_device_fault"() FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.raise_transaction_reversed_alert()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  sender_name   text;
  receiver_name text;
  msg           text;
begin
  select name into sender_name   from public.profiles where id = new.sender_id;
  select name into receiver_name from public.profiles where id = new.receiver_id;

  msg := format(
    '%s kWh transfer from %s to %s (ref %s) was reversed by an admin.',
    round(new.energy_amount, 2),
    coalesce(sender_name, 'a member'),
    coalesce(receiver_name, 'a member'),
    new.reference_code
  );

  insert into public.alerts (alert_type, user_id, message, severity, source)
  values
    ('transaction_reversed', new.sender_id,   msg, 'medium', 'system'),
    ('transaction_reversed', new.receiver_id, msg, 'medium', 'system');

  return new;
exception
  when others then
    raise warning 'raise_transaction_reversed_alert failed: %', sqlerrm;
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_job_closure()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  -- A transaction-scoped marker can only be created by key-checked simulator RPCs.
  if old.status <> 'completed' and new.status = 'completed' and old.is_simulated
     and old.device_fault_id is not null and exists (
       select 1 from simulator_private.operator_closures
       where job_id = old.id and transaction_id = txid_current()
     ) then
    new.completed_at := now();
    new.consumer_message := 'The simulator operator cleared this fault.';
    new.closure_record := jsonb_build_object('source','simulator','notes',new.resolution_notes,
      'completedAt',new.completed_at,'checklist',old.diagnostic_checklist,'photos',old.repair_photos,
      'technicianId',old.technician_id,'technicianName',old.technician_name);
    return new;
  end if;
  -- Allow the existing ON DELETE SET NULL foreign key to unlink a removed profile;
  -- the technician identity remains in the permanent closure snapshot.
  if old.status = 'completed' then
    if new.status is distinct from old.status
       or new.closure_record is distinct from old.closure_record
       or new.repair_photos is distinct from old.repair_photos
       or new.diagnostic_checklist is distinct from old.diagnostic_checklist
       or new.resolution_notes is distinct from old.resolution_notes
       or (new.technician_id is distinct from old.technician_id and not (
         new.technician_id is null and not exists (select 1 from public.profiles where id = old.technician_id)
       ))
       or new.technician_name is distinct from old.technician_name
       or new.completed_at is distinct from old.completed_at then
      raise exception 'Completed repair records cannot be changed.';
    end if;
    return new;
  end if;

  if new.status = 'completed' then
    if old.status <> 'active' or not public.is_technician()
       or auth.uid() is distinct from old.technician_id then
      raise exception 'Only the assigned technician can close an active job.';
    end if;
    if char_length(btrim(coalesce(new.resolution_notes, ''))) < 10
       or char_length(new.resolution_notes) > 500 then
      raise exception 'Write 10 to 500 characters describing the repair before closing.';
    end if;
    if jsonb_array_length(old.repair_photos) = 0 then
      raise exception 'Add at least one repair photo before closing this job.';
    end if;
    if exists (
      select 1 from jsonb_array_elements(old.repair_photos) p
      where not exists (
        select 1 from storage.objects o
        where o.bucket_id = 'repair-evidence' and o.name = p->>'path'
          and split_part(o.name, '/', 1) = old.id::text
          and o.metadata->>'mimetype' in ('image/jpeg', 'image/png')
          and (o.metadata->>'size')::bigint between 1 and 10485760
      )
    ) then
      raise exception 'Some repair photos are missing. Upload them again before closing.';
    end if;
    -- Never overwrite recently saved steps or evidence with an old client copy.
    new.diagnostic_checklist := old.diagnostic_checklist;
    new.repair_photos := old.repair_photos;
    new.technician_id := old.technician_id;
    new.technician_name := old.technician_name;
    new.resolution_notes := btrim(new.resolution_notes);
    new.completed_at := now();
    new.consumer_message := 'The technician has completed the repair. Thank you for your patience.';
    new.closure_record := jsonb_build_object(
      'photos', new.repair_photos, 'checklist', new.diagnostic_checklist,
      'notes', new.resolution_notes, 'completedAt', new.completed_at,
      'technicianId', new.technician_id, 'technicianName', new.technician_name
    );
  elsif new.closure_record is distinct from old.closure_record then
    raise exception 'A closure record is created only when a job is completed.';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_job_resolution_notes (
  p_job_id uuid,
  p_notes  text
)
  RETURNS public.jobs
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_job public.jobs;
begin
  if p_notes is null or char_length(p_notes) > 500 then
    raise exception 'Repair notes must be no longer than 500 characters.';
  end if;
  update public.jobs set resolution_notes = btrim(p_notes)
    where id = p_job_id and status = 'active' and technician_id = auth.uid() and public.is_technician()
    returning * into v_job;
  if not found then
    raise exception 'Only the assigned technician can save notes for an active job.';
  end if;
  return v_job;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sim_assert_key (
  p_key text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
  AS $function$
declare c public.sim_config;
begin
  select * into c from public.sim_config where id = 1;
  if not found or (c.require_key and (c.access_key_hash = '' or p_key is null or octet_length(p_key)>72 or crypt(p_key,c.access_key_hash) is distinct from c.access_key_hash)) then
    raise exception 'Invalid simulator key. Add ?key=… to the URL.' using errcode = '42501';
  end if;
end $function$;

REVOKE ALL ON FUNCTION "public"."sim_assert_key"(text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.sim_assert_leader (
  p_tab_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform 1 from public.sim_config where id = 1 and leader_tab_id = p_tab_id and lease_until > now() for update;
  if not found then raise exception 'Another tab controls the simulator. Wait for its lease to expire.' using errcode='42501'; end if;
end $function$;

REVOKE ALL ON FUNCTION "public"."sim_assert_leader"(uuid) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.sim_backfill (
  p_key    text,
  p_tab_id uuid,
  p_days   integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare d public.sim_devices; day date; prod numeric; cons numeric; i int;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_days not in (7,30) or p_days is null then raise exception 'Backfill supports 7 or 30 days'; end if;
  for d in select * from public.sim_devices loop
    for i in 1..p_days loop
      day := (now() at time zone 'Asia/Colombo')::date-i;
      prod:=d.capacity_kw*(4+0.5*sin(i));
      cons:=case d.load_profile when 'small' then 12.1 when 'large' then 30 when 'business' then 37.6 else 20.2 end*d.load_factor;
      delete from public.energy_records where user_id=d.household_user_id and is_simulated and (recorded_at at time zone 'Asia/Colombo')::date=day;
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,recorded_at,is_simulated) values(d.household_user_id,prod,cons,(day+time '23:59:00') at time zone 'Asia/Colombo',true);
    end loop;
    perform simulator_private.refresh_history(d.household_user_id);
  end loop;
  insert into public.sim_events(kind,message) values('backfill',p_days||' days of history generated');
end $function$;

CREATE OR REPLACE FUNCTION public.sim_bootstrap (
  p_key    text,
  p_tab_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare p record; capacity numeric; panels int;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  for p in select * from public.profiles where role in ('owner','consumer') loop
    capacity := case when p.role='owner' then least(100,greatest(0,coalesce(nullif(to_jsonb(p)->>'solar_capacity_kw','')::numeric,4))) else 0 end;
    panels := case when capacity>0 then least(200,greatest(1,ceil(capacity/0.4)::int)) else 0 end;
    insert into public.sim_devices(household_user_id,inverter_serial,capacity_kw,panel_count,string_count,panel_health)
    values (p.id,'SC-INV-'||upper(left(p.id::text,8)),capacity,panels,case when panels>=2 then 2 else 1 end,array_fill(1::numeric,array[panels])) on conflict (household_user_id) do nothing;
  end loop;
  return public.sim_snapshot(p_key);
end $function$;

CREATE OR REPLACE FUNCTION public.sim_claim_lease (
  p_key    text,
  p_tab_id uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform public.sim_assert_key(p_key);
  if p_tab_id is null then raise exception 'Tab id required'; end if;
  update public.sim_config set leader_tab_id = p_tab_id, lease_until = now() + interval '15 seconds'
    where id = 1 and (leader_tab_id = p_tab_id or lease_until is null or lease_until <= now());
  return found;
end $function$;

CREATE OR REPLACE FUNCTION public.sim_clear_fault (
  p_key       text,
  p_tab_id    uuid,
  p_device_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare f public.device_faults;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into f from public.device_faults where device_id=p_device_id and status='open' for update;
  if not found then return; end if;
  insert into simulator_private.operator_closures values(f.job_id,txid_current()) on conflict(job_id) do update set transaction_id=excluded.transaction_id;
  update public.jobs set status='completed',resolution_notes='Cleared from simulator' where id=f.job_id and status<>'completed';
  delete from simulator_private.operator_closures where job_id=f.job_id;
end $function$;

CREATE OR REPLACE FUNCTION public.sim_inject_fault (
  p_key       text,
  p_tab_id    uuid,
  p_device_id uuid,
  p_code      text,
  p_details   jsonb DEFAULT '{}'::jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare d public.sim_devices; fc public.sim_fault_codes; f uuid;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into strict d from public.sim_devices where id=p_device_id for update;
  select * into strict fc from public.sim_fault_codes where code=p_code;
  if d.capacity_kw=0 then raise exception 'Consumer-only households have no inverter to fault.'; end if;
  if jsonb_typeof(p_details) is distinct from 'object' then raise exception 'Fault details must be an object'; end if;
  if p_code='E06' and (coalesce((p_details->>'string')::int,0)<1 or (p_details->>'string')::int>d.string_count) then raise exception 'Choose a valid string'; end if;
  insert into public.device_faults(device_id,household_user_id,code,title,severity,details) values(d.id,d.household_user_id,fc.code,fc.title,fc.severity,p_details) returning id into f;
  return (select to_jsonb(x) from public.device_faults x where id=f);
end $function$;

CREATE OR REPLACE FUNCTION public.sim_push_tick (
  p_key      text,
  p_tab_id   uuid,
  p_tick_id  uuid,
  p_batch    jsonb,
  p_sim_time time without time zone
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare r jsonb; d public.sim_devices; f text; prod numeric; cons numeric; dp numeric; dc numeric; level numeric; flow numeric;
  slot int; n int; pool numeric; capacity numeric; online int; traded numeric;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_tick_id is null then raise exception 'Tick id required'; end if;
  if (select last_tick_id=p_tick_id from public.sim_config where id=1) then return; end if;
  if jsonb_typeof(p_batch) is distinct from 'array' or jsonb_array_length(p_batch)>500 then raise exception 'Expected up to 500 device readings'; end if;
  select count(distinct v->>'device_id') into n from jsonb_array_elements(p_batch) v;
  if n<>jsonb_array_length(p_batch) then raise exception 'Duplicate device readings'; end if;
  select coalesce(sum(capacity_kw),0),count(*) filter(where status in ('online','degraded')) into capacity,online from public.sim_devices;
  select coalesce(sum(greatest(0,(x->>'daily_production')::numeric-(x->>'daily_consumption')::numeric)),0) into pool from jsonb_array_elements(p_batch) x;
  for r in select * from jsonb_array_elements(p_batch) loop
    select * into strict d from public.sim_devices where id=(r->>'device_id')::uuid for update;
    select code into f from public.device_faults where device_id=d.id and status='open';
    if f='E07' then continue; end if;
    prod:=simulator_private.number(r,'instant_production',103); cons:=simulator_private.number(r,'instant_consumption',100);
    dp:=simulator_private.number(r,'daily_production',100000); dc:=simulator_private.number(r,'daily_consumption',100000);
    level:=simulator_private.number(r,'battery_level',100); flow:=(r->>'battery_power_flow')::numeric;
    if flow is null or not(flow between -103 and 103) then raise exception 'Invalid battery flow'; end if;
    if prod>d.capacity_kw*1.031 then raise exception 'Production exceeds inverter capacity'; end if;
    if f in ('E01','E04','E08') then prod:=0; end if;
    select coalesce(sum(energy_amount),0) into traded from public.transactions where sender_id=d.household_user_id and status='COMPLETED' and created_at >= date_trunc('day',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';
    insert into simulator_private.original_rows select 'energy_metrics',m.id::text,to_jsonb(m) from public.energy_metrics m where user_id=d.household_user_id and not is_simulated on conflict do nothing;
    insert into public.energy_metrics(user_id,instant_production,instant_consumption,daily_production,daily_consumption,battery_level,battery_capacity,battery_power_flow,surplus_available,coop_pool_shared_today,coop_members_online,coop_total_capacity,coop_tokens_earned,monetary_saved,co2_saved_kg,grid_independence,is_simulated,updated_at)
    values(d.household_user_id,prod,cons,dp,dc,round(level)::int,d.battery_kwh,flow,greatest(0,dp-dc-traded),pool,online,capacity,greatest(0,dp-dc)*0.22,least(dp,dc)*0.22,dp*0.82,case when dc=0 then 0 else least(100,round(dp/dc*100))::int end,true,now())
    on conflict(user_id) do update set instant_production=excluded.instant_production,instant_consumption=excluded.instant_consumption,daily_production=dp,daily_consumption=dc,battery_level=excluded.battery_level,battery_capacity=d.battery_kwh,battery_power_flow=flow,surplus_available=excluded.surplus_available,coop_pool_shared_today=pool,coop_members_online=online,coop_total_capacity=capacity,coop_tokens_earned=excluded.coop_tokens_earned,monetary_saved=excluded.monetary_saved,co2_saved_kg=excluded.co2_saved_kg,grid_independence=excluded.grid_independence,is_simulated=true,updated_at=now();
    update public.sim_devices set battery_level=level where id=d.id;
    if coalesce((r->>'write_record')::boolean,false) then
      insert into public.energy_records(user_id,production_kwh,consumption_kwh,recorded_at,is_simulated) values(d.household_user_id,dp,dc,now(),true);
      slot := (r->>'slot')::int+1;
      if slot is null or slot not between 1 and 12 then raise exception 'Invalid chart slot'; end if;
      insert into simulator_private.original_rows select 'chart_data',c.id::text,to_jsonb(c) from public.chart_data c where user_id=d.household_user_id and range='day' and not is_simulated on conflict do nothing;
      insert into public.chart_data(user_id,range,hours,production,consumption,surplus,deficit,is_simulated)
        values(d.household_user_id,'day',array['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),array_fill(0::numeric,array[12]),true)
      on conflict(user_id,range) do update set
        hours=excluded.hours,
        production=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.production else public.chart_data.production end,
        consumption=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.consumption else public.chart_data.consumption end,
        surplus=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.surplus else public.chart_data.surplus end,
        deficit=case when not public.chart_data.is_simulated or coalesce((r->>'rollover')::boolean,false) then excluded.deficit else public.chart_data.deficit end,is_simulated=true;
      update public.chart_data set production[slot]=prod,consumption[slot]=cons,surplus[slot]=greatest(0,prod-cons),deficit[slot]=greatest(0,cons-prod),updated_at=now() where user_id=d.household_user_id and range='day';
      if coalesce((r->>'rollover')::boolean,false) then perform simulator_private.refresh_history(d.household_user_id); end if;
    end if;
  end loop;
  update public.sim_config set sim_time=p_sim_time,last_tick_id=p_tick_id,updated_at=now() where id=1;
  delete from public.sim_events where id < (select coalesce(max(id),0)-1000 from public.sim_events);
end $function$;

CREATE OR REPLACE FUNCTION public.sim_reset (
  p_key    text,
  p_tab_id uuid,
  p_scope  text DEFAULT 'data'::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare d record; r record;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  if p_scope is null or p_scope not in ('data','all') then raise exception 'Reset scope must be data or all'; end if;
  update public.sim_config set running=false,last_tick_id=null where id=1;
  for d in select device_id from public.device_faults where status='open' loop perform public.sim_clear_fault(p_key,p_tab_id,d.device_id); end loop;
  delete from public.energy_records where is_simulated;
  delete from public.energy_metrics where is_simulated;
  delete from public.chart_data where is_simulated;
  for r in select * from simulator_private.original_rows loop
    if r.table_name='energy_metrics' then insert into public.energy_metrics select (jsonb_populate_record(null::public.energy_metrics,r.value)).* on conflict(user_id) do nothing;
    else insert into public.chart_data select (jsonb_populate_record(null::public.chart_data,r.value)).* on conflict(user_id,range) do nothing; end if;
  end loop;
  delete from simulator_private.original_rows;
  update public.sim_devices set battery_level=50;
  if p_scope='all' then
    delete from public.device_faults;
    delete from public.jobs where is_simulated;
    delete from public.alerts where is_simulated;
    delete from public.sim_devices;
    delete from public.sim_events;
  end if;
  insert into public.sim_events(kind,message) values('reset','Simulator reset ('||p_scope||')');
end $function$;

CREATE OR REPLACE FUNCTION public.sim_set_key (
  p_key text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
  AS $function$
begin
  if length(p_key) < 12 or octet_length(p_key) > 72 then raise exception 'Choose a demo key of 12 to 72 bytes.'; end if;
  update public.sim_config set access_key_hash = crypt(p_key, gen_salt('bf',10)), require_key = true,
    running = false, leader_tab_id = null, lease_until = null, updated_at = now() where id = 1;
end $function$;

REVOKE ALL ON FUNCTION "public"."sim_set_key"(text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.sim_snapshot (
  p_key text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform public.sim_assert_key(p_key);
  return jsonb_build_object(
    'config',(select to_jsonb(c) - 'access_key_hash' from public.sim_config c where id=1),
    'devices',coalesce((select jsonb_agg(to_jsonb(d) || jsonb_build_object('name',p.name,'role',p.role,'phone',p.mobile_number,
      'metrics',(select to_jsonb(m) from public.energy_metrics m where m.user_id=d.household_user_id)))
      from public.sim_devices d join public.profiles p on p.id=d.household_user_id),'[]'::jsonb),
    'faults',coalesce((select jsonb_agg(to_jsonb(f) || jsonb_build_object('job_status',j.status,'ticket_code',j.ticket_code,'technician_name',j.technician_name))
      from public.device_faults f left join public.jobs j on j.id=f.job_id where f.status='open'),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.id desc) from (select * from public.sim_events order by id desc limit 50) e),'[]'::jsonb)
  );
end $function$;

CREATE OR REPLACE FUNCTION public.sim_update_config (
  p_key    text,
  p_tab_id uuid,
  p_patch  jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  update public.sim_config set running=coalesce((p_patch->>'running')::boolean,running),
    mode=coalesce(p_patch->>'mode',mode), sim_time=coalesce((p_patch->>'sim_time')::time,sim_time),
    speed=coalesce((p_patch->>'speed')::int,speed), weather=coalesce(p_patch->>'weather',weather),
    random_faults=coalesce((p_patch->>'random_faults')::boolean,random_faults),
    fault_probability=coalesce((p_patch->>'fault_probability')::numeric,fault_probability), updated_at=now() where id=1;
  insert into public.sim_events(kind,message,data) values ('controls','Simulation controls changed',p_patch - 'access_key_hash');
end $function$;

CREATE OR REPLACE FUNCTION public.sim_update_device (
  p_key       text,
  p_tab_id    uuid,
  p_device_id uuid,
  p_patch     jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare d public.sim_devices; panels int; strings int; capacity numeric;
begin
  perform public.sim_assert_key(p_key); perform public.sim_assert_leader(p_tab_id);
  select * into strict d from public.sim_devices where id=p_device_id for update;
  panels := coalesce((p_patch->>'panel_count')::int,d.panel_count);
  strings := coalesce((p_patch->>'string_count')::int,d.string_count);
  capacity := coalesce((p_patch->>'capacity_kw')::numeric,d.capacity_kw);
  if d.active_fault_id is not null and p_patch ?| array['panel_count','string_count','capacity_kw'] then raise exception 'Clear the fault before changing the array.'; end if;
  if (panels>0 and strings>panels) or (capacity>0 and panels=0) then raise exception 'Producing devices need panels; strings cannot exceed panels.'; end if;
  if exists(select 1 from public.profiles where id=d.household_user_id and role='consumer') and (capacity>0 or panels>0) then raise exception 'Consumers have no solar array.'; end if;
  update public.sim_devices set capacity_kw=capacity,panel_count=panels,string_count=strings,
    panel_health=case when panels<>d.panel_count then array_fill(1::numeric,array[panels]) else panel_health end,
    load_profile=coalesce(p_patch->>'load_profile',load_profile),load_factor=coalesce((p_patch->>'load_factor')::numeric,load_factor),
    battery_kwh=coalesce((p_patch->>'battery_kwh')::numeric,battery_kwh),
    battery_level=coalesce((p_patch->>'battery_level')::numeric,battery_level),updated_at=now() where id=p_device_id;
end $function$;

CREATE OR REPLACE FUNCTION public.toggle_job_checklist_item (
  p_job_id uuid,
  p_index  integer
)
  RETURNS public.jobs
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_job public.jobs;
  v_done boolean;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found or not public.is_technician() or auth.uid() is distinct from v_job.technician_id
     or v_job.status <> 'active' then
    raise exception 'Only the assigned technician can edit an active repair checklist.';
  end if;
  if p_index is null or p_index < 0 or p_index >= jsonb_array_length(v_job.diagnostic_checklist) then
    raise exception 'This checklist item does not exist.';
  end if;
  v_done := coalesce((v_job.diagnostic_checklist->p_index->>'done')::boolean, false);
  update public.jobs set diagnostic_checklist = jsonb_set(
    diagnostic_checklist, array[p_index::text, 'done'], to_jsonb(not v_done)
  ) where id = p_job_id returning * into v_job;
  return v_job;
end;
$function$;

CREATE OR REPLACE FUNCTION public.touch_jobs_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trade_approve_request (
  p_request_id bigint
)
  RETURNS uuid
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
  select trade_private.approve_request(p_request_id);
$function$;

REVOKE ALL ON FUNCTION "public"."trade_approve_request"(bigint) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.trade_available_providers()
  RETURNS TABLE (
    id             uuid,
    name           text,
    household_id   text,
    rate_per_kwh   numeric,
    battery_soc    smallint,
    distance_label text,
    available_kwh  numeric
  )
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
  select * from trade_private.available_providers();
$function$;

REVOKE ALL ON FUNCTION "public"."trade_available_providers"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.trade_reject_request (
  p_request_id bigint
)
  RETURNS boolean
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
  select trade_private.reject_request(p_request_id);
$function$;

REVOKE ALL ON FUNCTION "public"."trade_reject_request"(bigint) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION simulator_private.number (
  p_row   jsonb,
  p_field text,
  p_max   numeric
)
  RETURNS numeric
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare n numeric;
begin
  n := (p_row->>p_field)::numeric;
  if n is null or not (n>=0 and n<=p_max) then raise exception 'Invalid reading: %',p_field; end if;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION simulator_private.refresh_history (
  p_user uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare r text; days int;
begin
  foreach r in array array['week','month'] loop
    days:=case when r='week' then 7 else 30 end;
    insert into simulator_private.original_rows select 'chart_data',c.id::text,to_jsonb(c) from public.chart_data c where user_id=p_user and range=r and not is_simulated on conflict do nothing;
    insert into public.chart_data(user_id,range,hours,production,consumption,surplus,deficit,is_simulated,updated_at)
    select p_user,r,array_agg(to_char(day,'MM/DD') order by day),array_agg(prod order by day),array_agg(cons order by day),array_agg(greatest(0,prod-cons) order by day),array_agg(greatest(0,cons-prod) order by day),true,now()
    from (
      select day,coalesce(e.production_kwh,0) prod,coalesce(e.consumption_kwh,0) cons
      from generate_series((now() at time zone 'Asia/Colombo')::date-(days-1),(now() at time zone 'Asia/Colombo')::date,interval '1 day') day
      left join lateral(select production_kwh,consumption_kwh from public.energy_records where user_id=p_user and (recorded_at at time zone 'Asia/Colombo')::date=day::date order by recorded_at desc,id desc limit 1) e on true
    ) points
    on conflict(user_id,range) do update set hours=excluded.hours,production=excluded.production,consumption=excluded.consumption,surplus=excluded.surplus,deficit=excluded.deficit,is_simulated=true,updated_at=now();
  end loop;
end $function$;

CREATE OR REPLACE FUNCTION simulator_private.sync_profile_device()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare capacity numeric; panels int; f record;
begin
  if tg_op='UPDATE' and old.role is not distinct from new.role then return new; end if;
  if tg_op='UPDATE' then
    -- A role change must not leave an old inverter fault or technician job open.
    for f in select df.job_id from public.device_faults df
      where df.household_user_id=new.id and df.status='open' loop
      insert into simulator_private.operator_closures values(f.job_id,txid_current()) on conflict(job_id) do update set transaction_id=excluded.transaction_id;
      update public.jobs set status='completed',resolution_notes='Simulator device changed with household role' where id=f.job_id and status<>'completed';
      delete from simulator_private.operator_closures where job_id=f.job_id;
    end loop;
  end if;
  if new.role not in ('owner','consumer') or new.role is null then
    delete from public.sim_devices where household_user_id=new.id;
    return new;
  end if;
  capacity := case when new.role='owner' then least(100,greatest(0,coalesce(nullif(to_jsonb(new)->>'solar_capacity_kw','')::numeric,4))) else 0 end;
  panels := case when capacity>0 then least(200,greatest(1,ceil(capacity/0.4)::int)) else 0 end;
  insert into public.sim_devices(household_user_id,inverter_serial,capacity_kw,panel_count,string_count,panel_health)
    values(new.id,'SC-INV-'||upper(left(new.id::text,8)),capacity,panels,case when panels>=2 then 2 else 1 end,array_fill(1::numeric,array[panels]))
  on conflict(household_user_id) do update set capacity_kw=excluded.capacity_kw,panel_count=excluded.panel_count,
    string_count=excluded.string_count,panel_health=excluded.panel_health,status='online',active_fault_id=null,updated_at=now();
  insert into public.sim_events(kind,household_user_id,message) values('device_provisioned',new.id,'Virtual device created for '||coalesce(new.name,'household'));
  return new;
end $function$;

CREATE OR REPLACE FUNCTION trade_private.approve_request (
  p_request_id bigint
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  request public.energy_requests%rowtype;
  provider public.profiles%rowtype;
  remaining_kwh numeric;
  transaction_id uuid := pg_catalog.gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Sign in to approve a request.' using errcode = '42501';
  end if;

  select * into request
  from public.energy_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;
  if request.provider_id <> auth.uid() then
    raise exception 'Only the provider can approve this request.' using errcode = '42501';
  end if;
  if request.status is distinct from 'PENDING' then
    raise exception 'This request has already been processed.';
  end if;
  if request.requester_id = request.provider_id then
    raise exception 'A provider cannot approve their own request.';
  end if;
   select * into provider
  from public.profiles
  where id = request.provider_id
  for update;

  if provider.role is distinct from 'owner' or provider.status is distinct from 'active' then
    raise exception 'This provider is not active.' using errcode = '42501';
  end if;

  remaining_kwh := trade_private.available_kwh(request.provider_id);
  if remaining_kwh is null then
    raise exception 'No current energy reading is available.';
  end if;
  if request.amount_requested_kwh > remaining_kwh then
    raise exception 'Insufficient available surplus.';
  end if;
   insert into public.transactions (
    id, request_id, sender_id, receiver_id, energy_amount,
    status, reference_code
  ) values (
    transaction_id,
    request.id,
    request.provider_id,
    request.requester_id,
    request.amount_requested_kwh,
    'COMPLETED',
    'TXN-' || upper(replace(transaction_id::text, '-', ''))
  );

  update public.energy_requests
  set status = 'COMPLETED'
  where id = request.id;

  return transaction_id;
end;
$function$;

CREATE OR REPLACE FUNCTION trade_private.available_kwh (
  p_provider_id uuid
)
  RETURNS numeric
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  with latest as (
    select greatest(0::numeric,coalesce(r.surplus_kwh,r.production_kwh-r.consumption_kwh)) measured_kwh,
      r.recorded_at,r.is_simulated
    from public.energy_records r where r.user_id=p_provider_id
    order by r.recorded_at desc,r.id desc limit 1
  )
  select greatest(0::numeric,latest.measured_kwh-coalesce((
    select sum(t.energy_amount) from public.transactions t
    where t.sender_id=p_provider_id and t.status='COMPLETED'
      and case when latest.is_simulated then
        t.created_at >= date_trunc('day',latest.recorded_at at time zone 'Asia/Colombo') at time zone 'Asia/Colombo'
      else t.created_at > latest.recorded_at end
  ),0::numeric)) from latest;
$function$;

CREATE OR REPLACE FUNCTION trade_private.available_providers()
  RETURNS TABLE (
    id             uuid,
    name           text,
    household_id   text,
    rate_per_kwh   numeric,
    battery_soc    smallint,
    distance_label text,
    available_kwh  numeric
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select
    provider.id,
    provider.name,
    provider.household_id,
    provider.rate_per_kwh,
    provider.battery_soc,
    provider.distance_label,
    coalesce(trade_private.available_kwh(provider.id), 0::numeric)
  from public.profiles as provider
  where auth.uid() is not null
    and provider.role = 'owner'
    and provider.status = 'active';
$function$;

CREATE OR REPLACE FUNCTION trade_private.reject_request (
  p_request_id bigint
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  request public.energy_requests%rowtype;
  provider public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to reject a request.' using errcode = '42501';
  end if;

  select * into request
  from public.energy_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found.' using errcode = 'P0002';
  end if;
  if request.provider_id <> auth.uid() then
    raise exception 'Only the provider can reject this request.' using errcode = '42501';
  end if;
  if request.status is distinct from 'PENDING' then
    raise exception 'This request has already been processed.';
  end if;

  select * into provider
  from public.profiles
  where id = request.provider_id
  for update;

  if provider.role is distinct from 'owner' or provider.status is distinct from 'active' then
    raise exception 'This provider is not active.' using errcode = '42501';
  end if;

  update public.energy_requests
  set status = 'REJECTED'
  where id = request.id;

  return true;
end;
$function$;

ALTER TABLE "public"."appliances"
  ADD CONSTRAINT "appliances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."chart_data"
  ADD CONSTRAINT "chart_data_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."complaints"
  ADD CONSTRAINT "complaints_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_faults"
  ADD CONSTRAINT "device_faults_alert_id_fkey" FOREIGN KEY (alert_id) REFERENCES public.alerts(id);

ALTER TABLE "public"."energy_history"
  ADD CONSTRAINT "energy_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."energy_metrics"
  ADD CONSTRAINT "energy_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."jobs"
  ADD CONSTRAINT "jobs_complaint_id_fkey" FOREIGN KEY (complaint_id) REFERENCES public.complaints(id) ON DELETE SET NULL;

ALTER TABLE "public"."device_faults"
  ADD CONSTRAINT "device_faults_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."alerts"
  ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_faults"
  ADD CONSTRAINT "device_faults_household_user_id_fkey" FOREIGN KEY (household_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."energy_records"
  ADD CONSTRAINT "energy_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."energy_requests"
  ADD CONSTRAINT "energy_requests_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."energy_requests"
  ADD CONSTRAINT "energy_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."jobs"
  ADD CONSTRAINT "jobs_household_user_id_fkey" FOREIGN KEY (household_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."jobs"
  ADD CONSTRAINT "jobs_technician_id_fkey" FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."sim_devices"
  ADD CONSTRAINT "sim_devices_household_user_id_fkey" FOREIGN KEY (household_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_faults"
  ADD CONSTRAINT "device_faults_device_id_fkey" FOREIGN KEY (device_id) REFERENCES public.sim_devices(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_faults"
  ADD CONSTRAINT "device_faults_code_fkey" FOREIGN KEY (code) REFERENCES public.sim_fault_codes(code);

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_request_id_fkey" FOREIGN KEY (request_id) REFERENCES public.energy_requests(id) ON DELETE SET NULL;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX alerts_active_dedupe_key_idx ON public.alerts USING btree (dedupe_key)
  WHERE ((status = 'active'::text) AND (dedupe_key IS NOT NULL));

CREATE UNIQUE INDEX device_faults_one_open ON public.device_faults USING btree (device_id)
  WHERE (status = 'open'::text);

CREATE INDEX energy_history_user_time_idx ON public.energy_history USING btree (user_id, created_at DESC);

CREATE INDEX energy_records_provider_latest_idx ON public.energy_records USING btree (user_id, recorded_at DESC, id DESC);

CREATE INDEX jobs_household_idx ON public.jobs USING btree (household_user_id, created_at DESC);

CREATE INDEX jobs_status_idx ON public.jobs USING btree (status, created_at DESC);

CREATE UNIQUE INDEX transactions_one_per_request_idx ON public.transactions USING btree (request_id)
  WHERE (request_id IS NOT NULL);

CREATE INDEX transactions_sender_time_idx ON public.transactions USING btree (sender_id, created_at DESC)
  WHERE (status = 'COMPLETED'::text);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_complaint_alert
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.raise_complaint_alert();

CREATE TRIGGER trg_complaint_job
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  WHEN ((new.type = 'System Fault'::text))
  EXECUTE FUNCTION public.raise_job_from_complaint();

CREATE TRIGGER trg_device_fault_job
  AFTER INSERT ON public.device_faults
  FOR EACH ROW
  EXECUTE FUNCTION public.raise_job_from_device_fault();

CREATE TRIGGER trg_job_closure
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.record_job_closure();

CREATE TRIGGER trg_job_completed_clear_fault
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_fault_on_job_completed();

CREATE TRIGGER trg_jobs_touch
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_jobs_updated_at();

CREATE TRIGGER trg_profile_sim_device
  AFTER INSERT OR UPDATE OF ROLE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION simulator_private.sync_profile_device();

CREATE TRIGGER trg_transaction_reversed_alert
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  WHEN (((old.status IS DISTINCT FROM new.status) AND (new.status = 'REVERSED'::text)))
  EXECUTE FUNCTION public.raise_transaction_reversed_alert();

CREATE POLICY "admin_write_alerts" ON "public"."alerts"
  FOR ALL
  TO PUBLIC
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "member_read_own_alerts" ON "public"."alerts"
  FOR SELECT
  TO PUBLIC
  USING
    ((((user_id = auth.uid()) OR (user_id IS NULL)) AND (alert_type <> ALL (ARRAY['large_transaction'::text, 'signup_pending'::text, 'member_silent'::text, 'complaint_new'::text,
    'complaint_aging'::text, 'system_error'::text]))));

CREATE POLICY "appliances_member_own" ON "public"."appliances"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "chart_data_member_own" ON "public"."chart_data"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "admins_read_all_complaints" ON "public"."complaints"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "admins_update_any_complaint" ON "public"."complaints"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "members_delete_open_complaints" ON "public"."complaints"
  FOR DELETE
  TO PUBLIC
  USING (((auth.uid() = user_id) AND (status = 'open'::text)));

CREATE POLICY "members_insert_own_complaints" ON "public"."complaints"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "members_read_own_complaints" ON "public"."complaints"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "members_update_open_complaints" ON "public"."complaints"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.uid() = user_id) AND (status = 'open'::text)))
  WITH CHECK (((auth.uid() = user_id) AND (status = 'open'::text)));

CREATE POLICY "energy_history_member_own" ON "public"."energy_history"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "energy_metrics_member_own" ON "public"."energy_metrics"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Allow public read access to energy records" ON "public"."energy_records"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow users to insert their own energy records" ON "public"."energy_records"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "admin_read_all_energy_records" ON "public"."energy_records"
  FOR SELECT
  TO PUBLIC
  USING (public.is_admin());

CREATE POLICY "Allow users to insert pending requests" ON "public"."energy_requests"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((auth.uid() = requester_id) AND (requester_id <> provider_id) AND (status = 'PENDING'::text)));

CREATE POLICY "Allow users to view requests they are involved in" ON "public"."energy_requests"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = requester_id) OR (auth.uid() = provider_id)));

CREATE POLICY "admin_read_all_energy_requests" ON "public"."energy_requests"
  FOR SELECT
  TO PUBLIC
  USING (public.is_admin());

CREATE POLICY "admin_all_jobs" ON "public"."jobs"
  FOR ALL
  TO PUBLIC
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "household_read_own_jobs" ON "public"."jobs"
  FOR SELECT
  TO PUBLIC
  USING ((household_user_id = auth.uid()));

CREATE POLICY "technician_insert_jobs" ON "public"."jobs"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (public.is_technician());

CREATE POLICY "technician_read_jobs" ON "public"."jobs"
  FOR SELECT
  TO PUBLIC
  USING (public.is_technician());

CREATE POLICY "technician_update_jobs" ON "public"."jobs"
  FOR UPDATE
  TO PUBLIC
  USING ((public.is_technician() AND ((technician_id IS NULL) OR (technician_id = auth.uid()))))
  WITH CHECK ((public.is_technician() AND (technician_id = auth.uid())));

CREATE POLICY "Allow public read access to profiles" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow users to update their own profiles" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Users can view own profile" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "admin_read_all_profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "admin_update_member_status" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "sender or receiver can read a transaction" ON "public"."transactions"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "admin_read_all_transactions" ON "public"."transactions"
  FOR SELECT
  TO PUBLIC
  USING (public.is_admin());

CREATE POLICY "admin_update_transaction_status" ON "public"."transactions"
  FOR UPDATE
  TO PUBLIC
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "repair_evidence_cleanup" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'repair-evidence'::text) AND public.is_technician() AND (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE (((j.id)::text = (storage.foldername(objects.name))[1]) AND (j.technician_id = auth.uid()) AND (NOT (EXISTS ( SELECT 1
           FROM jsonb_array_elements(j.repair_photos) p(VALUE)
          WHERE ((p.value ->> 'path'::text) = objects.name)))))))));

CREATE POLICY "repair_evidence_read" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'repair-evidence'::text) AND (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE (((j.id)::text = (storage.foldername(objects.name))[1]) AND (public.is_admin() OR (public.is_technician() AND (j.technician_id = auth.uid()))))))));

CREATE POLICY "repair_evidence_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'repair-evidence'::text) AND public.is_technician() AND (EXISTS ( SELECT 1
   FROM public.jobs j
  WHERE (((j.id)::text = (storage.foldername(objects.name))[1]) AND (j.status = 'active'::text) AND (j.technician_id = auth.uid()))))));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."device_faults";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."energy_metrics";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."jobs";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sim_devices";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sim_events";

COMMENT ON COLUMN "public"."alerts"."source" IS 'Who raised this alert: an admin via the app, or the system (automatic detection).';

COMMENT ON COLUMN "public"."alerts"."user_id" IS 'Null = community-wide alert, not tied to one member.';

COMMENT ON COLUMN "public"."jobs"."consumer_message" IS 'Calm, plain-language message shown to the household. Never contains error codes.';

COMMENT ON COLUMN "public"."jobs"."technician_name" IS 'Snapshotted on accept so the household can see who is coming without reading profiles.';

COMMENT ON TABLE "public"."jobs" IS 'Technician job tickets. One row per fault; read by both the technician and the affected household.';

REVOKE ALL ON FUNCTION "public"."attach_job_repair_photo"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."attach_job_repair_photo"(uuid, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."attach_job_repair_photo"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."attach_job_repair_photo"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."attach_job_repair_photo"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."clear_fault_on_job_completed"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."clear_fault_on_job_completed"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."clear_fault_on_job_completed"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."complete_job_ticket"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."complete_job_ticket"(uuid, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."complete_job_ticket"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."complete_job_ticket"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."complete_job_ticket"(uuid, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_technician"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_technician"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_technician"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_technician"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."raise_complaint_alert"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."raise_complaint_alert"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_complaint_alert"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_complaint_alert"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."raise_job_from_complaint"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."raise_job_from_complaint"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_job_from_complaint"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_job_from_complaint"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."raise_job_from_device_fault"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_job_from_device_fault"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_job_from_device_fault"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."raise_transaction_reversed_alert"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."raise_transaction_reversed_alert"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_transaction_reversed_alert"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."raise_transaction_reversed_alert"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."record_job_closure"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_job_closure"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."record_job_closure"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."record_job_closure"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."record_job_closure"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."save_job_resolution_notes"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."save_job_resolution_notes"(uuid, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."save_job_resolution_notes"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."save_job_resolution_notes"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."save_job_resolution_notes"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_assert_key"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_assert_key"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_assert_key"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_assert_leader"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_assert_leader"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_assert_leader"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_backfill"(text, uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_backfill"(text, uuid, integer) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_backfill"(text, uuid, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_backfill"(text, uuid, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_backfill"(text, uuid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_bootstrap"(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_bootstrap"(text, uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_bootstrap"(text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_bootstrap"(text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_bootstrap"(text, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_claim_lease"(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_claim_lease"(text, uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_claim_lease"(text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_claim_lease"(text, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_claim_lease"(text, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_clear_fault"(text, uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_clear_fault"(text, uuid, uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_clear_fault"(text, uuid, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_clear_fault"(text, uuid, uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_clear_fault"(text, uuid, uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_inject_fault"(text, uuid, uuid, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_inject_fault"(text, uuid, uuid, text, jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_inject_fault"(text, uuid, uuid, text, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_inject_fault"(text, uuid, uuid, text, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_inject_fault"(text, uuid, uuid, text, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_push_tick"(text, uuid, uuid, jsonb, time WITHOUT time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_push_tick"(text, uuid, uuid, jsonb, time WITHOUT time zone) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_push_tick"(text, uuid, uuid, jsonb, time WITHOUT time zone) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_push_tick"(text, uuid, uuid, jsonb, time WITHOUT time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_push_tick"(text, uuid, uuid, jsonb, time WITHOUT time zone) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_reset"(text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_reset"(text, uuid, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_reset"(text, uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_reset"(text, uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_reset"(text, uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_set_key"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_set_key"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_set_key"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_snapshot"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_snapshot"(text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_snapshot"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_snapshot"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_snapshot"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_update_config"(text, uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_update_config"(text, uuid, jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_update_config"(text, uuid, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_update_config"(text, uuid, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_update_config"(text, uuid, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sim_update_device"(text, uuid, uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sim_update_device"(text, uuid, uuid, jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sim_update_device"(text, uuid, uuid, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_update_device"(text, uuid, uuid, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sim_update_device"(text, uuid, uuid, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."toggle_job_checklist_item"(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."toggle_job_checklist_item"(uuid, integer) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."toggle_job_checklist_item"(uuid, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."toggle_job_checklist_item"(uuid, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."toggle_job_checklist_item"(uuid, integer) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."touch_jobs_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."touch_jobs_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."touch_jobs_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."touch_jobs_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."trade_approve_request"(bigint) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."trade_approve_request"(bigint) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_approve_request"(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_approve_request"(bigint) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."trade_available_providers"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."trade_available_providers"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_available_providers"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_available_providers"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."trade_reject_request"(bigint) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."trade_reject_request"(bigint) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_reject_request"(bigint) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."trade_reject_request"(bigint) TO "service_role";

REVOKE ALL ON FUNCTION "simulator_private"."sync_profile_device"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "trade_private"."approve_request"(bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "trade_private"."approve_request"(bigint) TO "authenticated";

REVOKE ALL ON FUNCTION "trade_private"."available_kwh"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "trade_private"."available_kwh"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "trade_private"."available_providers"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "trade_private"."available_providers"() TO "authenticated";

REVOKE ALL ON FUNCTION "trade_private"."reject_request"(bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "trade_private"."reject_request"(bigint) TO "authenticated";

GRANT USAGE ON SCHEMA "trade_private" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."energy_records_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_records_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."energy_records_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_records_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."energy_records_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_records_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."energy_records_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_records_id_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."energy_requests_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_requests_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."energy_requests_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_requests_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."energy_requests_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_requests_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."energy_requests_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."energy_requests_id_seq" TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jobs_ticket_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."jobs_ticket_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jobs_ticket_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."jobs_ticket_seq" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."sim_events_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."sim_events_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."sim_events_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."sim_events_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."sim_events_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."sim_events_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."sim_events_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."sim_events_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."alerts" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."alerts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."alerts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."alerts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appliances" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."appliances" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appliances" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."appliances" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chart_data" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chart_data" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chart_data" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chart_data" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."complaints" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."complaints" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."complaints" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."complaints" TO "service_role";

REVOKE ALL ON TABLE "public"."device_faults" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."device_faults" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."device_faults" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_history" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."energy_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_history" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_history" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_metrics" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."energy_metrics" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_metrics" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_metrics" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_records" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."energy_records" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_records" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_records" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_requests" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."energy_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_requests" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."energy_requests" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jobs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."jobs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jobs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jobs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."sim_config" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_config" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_config" TO "service_role";

REVOKE ALL ON TABLE "public"."sim_devices" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_devices" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_devices" TO "service_role";

REVOKE ALL ON TABLE "public"."sim_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_events" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_events" TO "service_role";

REVOKE ALL ON TABLE "public"."sim_fault_codes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_fault_codes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sim_fault_codes" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."transactions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "service_role";
