-- Apply AFTER 202611150001_accounts_sleep.sql. Existing rows are archived, not deleted.
begin;
alter table public.sleep_records rename to sleep_records_legacy;
revoke all on public.sleep_records_legacy from anon, authenticated;
comment on table public.sleep_records_legacy is 'Archived nightly summary records before conversion to timestamped sensor readings. Admin access only.';
create table public.sleep_records (
  id uuid constraint sensor_records_pkey primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  air_quality numeric(12,3) check (air_quality >= 0),
  lux numeric(12,3) check (lux >= 0),
  temperature_c numeric(8,3),
  humidity_pct numeric(6,3) check (humidity_pct between 0 and 100),
  sound_level numeric(12,3) check (sound_level >= 0)
);
create index sensor_records_owner_timestamp on public.sleep_records(user_id,"timestamp" desc);
alter table public.sleep_records enable row level security;
revoke all on public.sleep_records from anon, authenticated;
grant select, insert, update, delete on public.sleep_records to authenticated;
create policy sensor_select_own on public.sleep_records for select to authenticated using ((select auth.uid()) = user_id);
create policy sensor_insert_own on public.sleep_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sensor_update_own on public.sleep_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sensor_delete_own on public.sleep_records for delete to authenticated using ((select auth.uid()) = user_id);
commit;
