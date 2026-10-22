-- Enable Midtrans Snap as an optional payment method.
-- Existing manual_dana orders and payment statuses remain unchanged.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('manual_dana', 'midtrans_snap'));
