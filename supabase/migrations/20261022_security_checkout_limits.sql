-- PrimeHub security hardening and private checkout rate limit.
-- Safe to apply to the existing PrimeHub schema.

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Anyone can read active products or admins" on public.products;
drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Anyone can read active products or admins"
  on public.products for select to anon, authenticated
  using (
    is_active = true
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  );

create policy "Admins can update products"
  on public.products for update to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  );

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
  on public.orders for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update to authenticated
  using (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Customers can read own order items" on public.order_items;
create policy "Customers can read own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = (select auth.uid())
          or exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.is_admin = true)
        )
    )
  );

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.primehub_checkout_rate_limits (
  client_hash text not null check (client_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds in (60, 86400)),
  hit_count integer not null default 0 check (hit_count > 0),
  primary key (client_hash, window_start, window_seconds)
);

alter table private.primehub_checkout_rate_limits enable row level security;
revoke all on table private.primehub_checkout_rate_limits from public, anon, authenticated;

create or replace function public.consume_primehub_checkout_limit(p_client_hash text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_minute_count integer;
  v_day_count integer;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into private.primehub_checkout_rate_limits as limits
    (client_hash, window_start, window_seconds, hit_count)
  values (p_client_hash, date_trunc('minute', v_now), 60, 1)
  on conflict (client_hash, window_start, window_seconds)
  do update set hit_count = limits.hit_count + 1
  returning hit_count into v_minute_count;

  insert into private.primehub_checkout_rate_limits as limits
    (client_hash, window_start, window_seconds, hit_count)
  values (p_client_hash, date_trunc('day', v_now), 86400, 1)
  on conflict (client_hash, window_start, window_seconds)
  do update set hit_count = limits.hit_count + 1
  returning hit_count into v_day_count;

  if v_minute_count = 1 then
    delete from private.primehub_checkout_rate_limits
    where window_start < v_now - interval '2 days';
  end if;

  return v_minute_count <= 12 and v_day_count <= 80;
end;
$$;

revoke all on function public.consume_primehub_checkout_limit(text) from public, anon, authenticated;
grant execute on function public.consume_primehub_checkout_limit(text) to service_role;

-- Explicit service-role-only policy keeps private rate-limit rows unavailable
-- through the Data API to anonymous or ordinary signed-in users.
drop policy if exists "Service role manages checkout rate limits" on private.primehub_checkout_rate_limits;
create policy "Service role manages checkout rate limits"
  on private.primehub_checkout_rate_limits
  for all to service_role
  using (true)
  with check (true);
