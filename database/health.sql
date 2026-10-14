-- Read-only schema checks; no household identities, secrets or data are returned.
select current_database() as database_name, now() as checked_at,
  (select jsonb_agg(jsonb_build_object('column',c.column_name,'type',c.data_type,'generated',c.is_generated,'expression',c.generation_expression) order by c.ordinal_position)
   from information_schema.columns c
   where c.table_schema='public' and c.table_name='energy_records'
     and c.column_name in ('production_kwh','consumption_kwh','surplus_kwh','recorded_at','is_simulated')) as energy_columns,
  (select jsonb_object_agg(name,to_regclass('public.'||name) is not null)
   from unnest(array['profiles','energy_records','energy_metrics','chart_data','jobs','sim_devices','device_faults']) name) as tables,
  to_regprocedure('public.sim_push_tick(text,uuid,uuid,jsonb,time without time zone)') is not null as tick_function_exists,
  coalesce(position('surplus_kwh,recorded_at' in pg_get_functiondef(
    to_regprocedure('public.sim_push_tick(text,uuid,uuid,jsonb,time without time zone)'))) > 0,false) as obsolete_surplus_insert;
