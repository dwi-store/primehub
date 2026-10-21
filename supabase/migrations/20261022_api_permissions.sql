-- Explicit API grants for PrimeHub's RLS-protected tables.
-- Apply after schema.sql on an existing project.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.profiles to authenticated;

grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
