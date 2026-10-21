-- PrimeHub database foundation (Supabase/PostgreSQL)
-- Apply this in a NEW Supabase project only after reviewing it.
-- Order creation and stock changes must be performed by a trusted server/Edge Function,
-- never by the public browser client.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null default 'Lainnya',
  image_url text,
  price_idr bigint not null check (price_idr >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_contact text not null,
  customer_note text not null default '',
  total_idr bigint not null check (total_idr >= 0),
  payment_method text not null default 'manual_dana'
    check (payment_method in ('manual_dana')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending_payment'
    check (order_status in ('pending_payment', 'processing', 'completed', 'cancelled')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_idr bigint not null check (unit_price_idr >= 0),
  line_total_idr bigint not null check (line_total_idr >= 0)
);

create index if not exists products_active_category_idx
  on public.products (is_active, category);
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx
  on public.orders (order_status, created_at desc);
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public storefront can read active products only.
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

-- Admins can manage products. is_admin must be assigned securely by the project owner,
-- not from a public signup form.
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Users may read only their own profile. Do not add a public update policy for is_admin.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Customers can read their own orders; admins can read all orders.
drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
  on public.orders for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Order lines are visible only when the parent order belongs to the customer or is viewed by an admin.
drop policy if exists "Customers can read own order items" on public.order_items;
create policy "Customers can read own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
        )
    )
  );

-- Intentionally no browser INSERT policies for orders/order_items and no direct stock-update policy.
-- Implement atomic order creation, authoritative price checks, stock reservation, order codes,
-- and manual payment verification in a trusted Supabase Edge Function before accepting orders.
