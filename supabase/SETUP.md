# PrimeHub Supabase setup

## Live project status (22 October 2026)
The connected `primehub` project in Singapore has the four core tables (`profiles`, `products`, `orders`, `order_items`) with Row Level Security enabled. The profile bootstrap, stock-on-cancellation, and checkout security/rate-limit migrations have been applied directly to the linked database. The `create-order` Edge Function is deployed and active.

The project currently has no Auth users, products, or orders. Admin login cannot be completed until an owner account exists and its admin role is assigned. Automatic DANA verification is not integrated; new orders remain pending until an authorized admin verifies payment.

## Database and Auth setup
1. For a new Supabase project only, run `schema.sql` in SQL Editor. For this existing project, do not rerun the whole schema; it is already present.
2. If recreating or repairing an existing installation, apply `migrations/20261022_profile_bootstrap.sql` and `migrations/20261022_api_permissions.sql`.
3. Apply `migrations/20261022_create_order_function.sql`, `migrations/20261022_release_stock_on_cancellation.sql`, and `migrations/20261022_security_checkout_limits.sql` in that order.
4. Create/confirm the owner admin account in Supabase Auth. Then, as project owner, grant admin role to that account's exact email:
   ```sql
   insert into public.profiles (id, display_name, is_admin)
   select id, email, true
   from auth.users
   where lower(email) = lower('ADMIN_EMAIL_HERE')
   on conflict (id) do update set is_admin = true;
   ```
   Never expose admin-role changes in a public signup form or browser client.
5. The current GitHub Pages workflow uses the project's public Supabase URL and publishable key as safe frontend values. They are not service credentials. Never put `SUPABASE_SERVICE_ROLE_KEY` in browser code, GitHub source, or a `NEXT_PUBLIC_*` variable.
6. Add only accurate products with real prices and stock to the Supabase `products` table; the storefront displays active products only.

## Order function
`create-order` accepts `customer_name`, `customer_contact`, optional `customer_note`, and `items: [{ product_id, quantity }]`. Prices are read from the database instead of accepted from the browser. Product rows are locked and stock is decremented in one database transaction; the order code is returned with payment status `pending`. The public endpoint restricts browser origins, applies database-backed rate limits per detected client IP, validates input, and uses server-side service credentials.

## Launch safeguards
The cancellation migration returns stock only when an unpaid/failed order is cancelled; cancelled orders cannot be reopened. Paid-order refunds and inventory decisions require manual review. The public `create-order` function has `verify_jwt = false` because customers do not sign in; it allows 12 requests per minute and 80 per day per detected client IP. It stores HMAC fingerprints in a private schema rather than raw IP addresses. CAPTCHA/Turnstile and privacy/retention controls are still recommended before broad public traffic. Run the Supabase security advisors and end-to-end checkout tests before launch. Keep all secrets out of commits.
