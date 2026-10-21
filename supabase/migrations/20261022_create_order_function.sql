-- PrimeHub: trusted atomic order creation
-- Apply after supabase/schema.sql. Only service_role may execute this function.
create or replace function public.create_primehub_order(
  p_customer_name text,
  p_customer_contact text,
  p_customer_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_code text := 'PH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_total bigint := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 100 then
    raise exception 'Nama harus 2-100 karakter';
  end if;
  if length(trim(coalesce(p_customer_contact, ''))) not between 3 and 160 then
    raise exception 'Kontak harus 3-160 karakter';
  end if;
  if length(coalesce(p_customer_note, '')) > 1000 then
    raise exception 'Catatan maksimal 1000 karakter';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 10 then
    raise exception 'Pesanan harus berisi 1-10 jenis produk';
  end if;

  -- Lock products in sorted order to avoid overselling and reduce deadlocks.
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by (value->>'product_id')
  loop
    if (v_item->>'quantity') !~ '^[1-9][0-9]{0,3}$' then
      raise exception 'Jumlah produk tidak valid';
    end if;
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and is_active = true
      for update;
    if not found then raise exception 'Produk tidak tersedia'; end if;
    if v_product.stock < v_qty then raise exception 'Stok tidak mencukupi untuk %', v_product.name; end if;
    v_total := v_total + v_product.price_idr * v_qty;
    if v_total > 1000000000 then raise exception 'Total pesanan terlalu besar'; end if;
  end loop;

  insert into public.orders (id, order_code, customer_name, customer_contact, customer_note, total_idr)
  values (v_order_id, v_order_code, trim(p_customer_name), trim(p_customer_contact),
          coalesce(p_customer_note, ''), v_total);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and is_active = true
      for update;
    update public.products set stock = stock - v_qty, updated_at = now()
      where id = v_product.id and stock >= v_qty;
    if not found then raise exception 'Stok berubah, silakan coba lagi'; end if;
    insert into public.order_items
      (order_id, product_id, product_name, quantity, unit_price_idr, line_total_idr)
    values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price_idr, v_product.price_idr * v_qty);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_code', v_order_code,
    'total_idr', v_total, 'payment_status', 'pending', 'order_status', 'pending_payment');
end;
$$;

revoke all on function public.create_primehub_order(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_primehub_order(text, text, text, jsonb) to service_role;
