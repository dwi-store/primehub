# PrimeHub Supabase setup

## Status
The GitHub Pages deployment can build independently of the Supabase backend. The SQL and Edge Function in this repository do not become active until applied/deployed to the Supabase project. DANA payment is not integrated; orders remain pending for manual verification.

## Database and Auth setup
1. In the Supabase SQL Editor, run `schema.sql` for a new project. If the schema was already applied, run the migrations below rather than running the whole schema again.
2. Run `migrations/20261022_profile_bootstrap.sql`. This creates profiles for existing Auth users and automatically creates a non-admin profile for new Auth users.
3. Run `migrations/20261022_api_permissions.sql` to ensure the API grants needed by RLS-protected tables are present.
4. Run `migrations/20261022_create_order_function.sql`.
5. Run `migrations/20261022_release_stock_on_cancellation.sql`.
6. Create or confirm the admin user's account in Supabase Auth. Then, as project owner in the SQL Editor, grant admin role for that exact email (replace the placeholder below with the admin email):
   ```sql
   insert into public.profiles (id, display_name, is_admin)
   select id, email, true
   from auth.users
   where lower(email) = lower('ADMIN_EMAIL_HERE')
   on conflict (id) do update set is_admin = true;
   ```
   This must be performed only by the project owner. Never expose admin-role changes through public signup or browser forms.
7. Deploy the Edge Function `create-order` using Supabase CLI from the repository root:
   `npx supabase functions deploy create-order --project-ref YOUR_PROJECT_REF`
8. In Edge Function secrets, confirm the platform supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never place the service-role key in browser code, GitHub, or a public environment variable.
9. Configure these GitHub Actions repository variables or secrets for the static build: `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These public browser credentials are embedded in the deployed site; the service-role key must never use a `NEXT_PUBLIC_*` name.
10. Add real, accurate products to the Supabase `products` table with current prices and available stock. With public configuration present, the storefront reads active products and the order form calls `create-order`.

## Order function
`create-order` accepts `customer_name`, `customer_contact`, optional `customer_note`, and `items: [{ product_id, quantity }]`. Prices are read from the database rather than accepted from the browser. Product rows are locked and stock is decremented in a database transaction; the order code is returned with payment status `pending`.

## Launch safeguards
The cancellation migration returns stock only when an unpaid/failed order is cancelled; cancelled orders cannot be reopened. Paid-order refunds and inventory decisions require manual review. The public `create-order` function has `verify_jwt = false` because customers do not sign in. Rate limiting/CAPTCHA, privacy/retention controls, RLS verification and end-to-end checkout tests are still required before public launch. Keep all secrets out of commits.
