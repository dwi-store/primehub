-- Release reserved stock when an unpaid order is cancelled.
-- Apply after schema.sql and create_order_function migration.

alter table public.orders
  add column if not exists stock_released_at timestamptz;

create or replace function public.release_primehub_stock_when_order_cancelled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A cancelled order is terminal; do not reopen it and risk double reservation.
  if old.order_status = 'cancelled' and new.order_status <> 'cancelled' then
    raise exception 'Pesanan yang dibatalkan tidak dapat dibuka kembali';
  end if;

  -- Restore inventory only for orders that have not been marked paid.
  -- Paid/refunded digital products must be reviewed manually before inventory is restored.
  if new.order_status = 'cancelled'
     and old.order_status <> 'cancelled'
     and old.payment_status in ('pending', 'failed')
     and new.payment_status in ('pending', 'failed')
     and new.stock_released_at is null then
    update public.products as p
      set stock = p.stock + items.quantity,
          updated_at = now()
      from (
        select product_id, sum(quantity)::integer as quantity
          from public.order_items
         where order_id = new.id
           and product_id is not null
         group by product_id
      ) as items
     where p.id = items.product_id;

    new.stock_released_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.release_primehub_stock_when_order_cancelled()
  from public, anon, authenticated;

drop trigger if exists primehub_release_stock_on_cancellation on public.orders;
create trigger primehub_release_stock_on_cancellation
before update of order_status, payment_status on public.orders
for each row
execute function public.release_primehub_stock_when_order_cancelled();
