-- Allow admins to permanently remove only cancelled orders that were never paid
-- or whose payment failed. Paid/refunded rows remain as an audit record.
grant delete on public.orders to authenticated;

drop policy if exists "Admins can delete cancelled unpaid orders" on public.orders;
create policy "Admins can delete cancelled unpaid orders"
  on public.orders for delete
  to authenticated
  using (
    order_status = 'cancelled'
    and payment_status in ('pending', 'failed')
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );
