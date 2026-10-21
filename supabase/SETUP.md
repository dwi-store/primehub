# PrimeHub Supabase setup

## Status
The GitHub Pages build is separate from the backend. The SQL and Edge Function in this folder are source files only until a project owner applies/deploys them in Supabase. DANA payment is not integrated; orders remain pending for manual verification.

## New project setup
1. Create a new Supabase project in the Supabase Dashboard.
2. Open SQL Editor and run `schema.sql`.
3. Run `migrations/20261022_api_permissions.sql` to ensure the API grants needed by RLS-protected tables are present (especially if you ran an earlier version of `schema.sql`).
4. Run `migrations/20261022_create_order_function.sql`.
5. Run `migrations/20261022_release_stock_on_cancellation.sql` to return stock for unpaid orders that admins cancel.
6. Deploy the Edge Function `create-order` using Supabase CLI from the repository root:
   `npx supabase functions deploy create-order --project-ref YOUR_PROJECT_REF`
6. In Edge Function secrets, confirm the platform supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never place the service-role key in browser code, GitHub, or a public environment variable.
7. Configure these GitHub Actions repository variables or secrets for the static build: `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are public browser credentials and will be embedded in site JavaScript; the service-role key must never use a `NEXT_PUBLIC_*` name.
8. Add real, accurate products from the Supabase Table Editor with price and available stock. When public configuration is present, the storefront reads active products from Supabase and the order form calls the `create-order` function.
9. Configure an admin account only after Auth is set up; assign `profiles.is_admin=true` through the SQL Editor as project owner. Do not expose this field in signup or public UI.

## Order function
`create-order` accepts `customer_name`, `customer_contact`, optional `customer_note`, and `items: [{ product_id, quantity }]`. Prices are read from the database, not accepted from the browser. Product rows are locked and stock decremented in a database transaction; an order code is returned with payment status `pending`.

## Important
The cancellation migration releases stock only when an unpaid/failed order is cancelled; cancelled orders cannot be reopened. Paid-order refunds and inventory decisions still require manual review. The public `create-order` function is configured with `verify_jwt = false` because customers do not sign in; input validation is implemented, but rate limiting/CAPTCHA and privacy/retention controls are required before public launch. Test RLS grants and policies in Supabase before production. Keep all secrets out of commits.
