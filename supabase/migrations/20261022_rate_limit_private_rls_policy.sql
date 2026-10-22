drop policy if exists "Service role manages checkout rate limits" on private.primehub_checkout_rate_limits;
create policy "Service role manages checkout rate limits"
  on private.primehub_checkout_rate_limits
  for all
  to service_role
  using (true)
  with check (true);