-- Explicit privileges for the trusted receiver's server-side key.
grant usage on schema public to service_role;
grant select, insert on public.sleep_records to service_role;
