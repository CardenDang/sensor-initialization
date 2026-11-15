-- Run in SQL Editor as postgres after the migration. Every fixture is rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','rls-test-a@example.invalid','{"full_name":"RLS Test A"}'),
('22222222-2222-4222-8222-222222222222','rls-test-b@example.invalid','{"full_name":"RLS Test B"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.sleep_records(timestamp,air_quality,lux,temperature_c,humidity_pct,sound_level)
values ('2026-01-01T23:00:00Z',1230,2.4,21.5,48,145);
do $$ begin
  if (select count(*) from public.sleep_records) <> 1 then raise exception 'Owner cannot read own record'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'Profile ownership failed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare affected integer; begin
  if (select count(*) from public.sleep_records) <> 0 then raise exception 'Account B can read account A data'; end if;
  update public.sleep_records set lux=10;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Account B can update account A data'; end if;
  delete from public.sleep_records;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Account B can delete account A data'; end if;
  begin
    insert into public.sleep_records(user_id,timestamp,air_quality,lux,temperature_c,humidity_pct,sound_level)
    values ('11111111-1111-4111-8111-111111111111','2026-01-02T23:00:00Z',1230,2.4,21.5,48,145);
    raise exception 'Account B can insert records as account A';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;

