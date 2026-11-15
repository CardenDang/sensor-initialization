-- Apply once in the Supabase SQL Editor before registering users.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create function public.create_sleep_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name) values (new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),'Sleeper'),80));
  return new;
end;
$$;
revoke all on function public.create_sleep_profile() from public, anon, authenticated;
create trigger create_sleep_profile_after_signup after insert on auth.users for each row execute function public.create_sleep_profile();
insert into public.profiles(id,full_name) select id,left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'),''),'Sleeper'),80) from auth.users on conflict(id) do nothing;

create table public.sleep_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sleep_date date not null,
  bedtime time not null,
  wake_time time not null,
  duration_hours numeric(4,2) not null check (duration_hours > 0 and duration_hours <= 24),
  deep_hours numeric(4,2) not null check (deep_hours between 0 and 24),
  rem_hours numeric(4,2) not null check (rem_hours between 0 and 24),
  light_hours numeric(4,2) not null check (light_hours between 0 and 24),
  awake_hours numeric(4,2) not null check (awake_hours between 0 and 24),
  heart_rate_avg smallint not null check (heart_rate_avg between 20 and 250),
  heart_rate_min smallint not null check (heart_rate_min between 20 and 250 and heart_rate_min <= heart_rate_avg),
  score smallint not null check (score between 0 and 100),
  created_at timestamptz not null default now(),
  unique(user_id,sleep_date)
);
alter table public.sleep_records enable row level security;
revoke all on public.sleep_records from anon, authenticated;
grant select, insert, update, delete on public.sleep_records to authenticated;
create policy sleep_select_own on public.sleep_records for select to authenticated using ((select auth.uid()) = user_id);
create policy sleep_insert_own on public.sleep_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sleep_update_own on public.sleep_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sleep_delete_own on public.sleep_records for delete to authenticated using ((select auth.uid()) = user_id);
commit;
