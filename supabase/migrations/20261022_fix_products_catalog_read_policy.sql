-- Fix public storefront reads for the active product catalog.
-- Keep the public rule simple so the anon role does not need SELECT on profiles.
-- Admins have a separate policy to see inactive products in the dashboard.

drop policy if exists "Anyone can read active products or admins" on public.products;

create policy "Anyone can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can read all products"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  )
);
