# PrimeHub Supabase setup

## Status
The GitHub Pages build is separate from the backend. The SQL and Edge Function in this folder are source files only until a project owner applies/deploys them in Supabase. DANA payment is not integrated; orders remain pending for manual verification.

## New project setup
1. Create a new Supabase project in the Supabase Dashboard.
2. Open SQL Editor and run `schema.sql`.
3. Then run `migrations/20261022_create_order_function.sql`.
4. Deploy the Edge Function `create-order` using Supabase CLI from the repository root:
   `npx supabase functions deploy create-order --project-ref YOUR_PROJECT_REF`
5. In Edge Function secrets, confirm the platform supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never place the service-role key in browser code, GitHub, or a public environment variable.
6. Add sample products from the Supabase Table Editor, including a positive/zero price and a stock count. The frontend catalog should only be switched to live data after the project URL and publishable key are configured.
7. Test a valid order, invalid product ID, quantity 0, insufficient stock, and two simultaneous orders for the final unit. Confirm stock never goes negative.
8. Configure an admin account only after Auth is set up; assign `profiles.is_admin=true` through the SQL Editor as project owner. Do not expose this field in signup or public UI.

## Order function
`create-order` accepts `customer_name`, `customer_contact`, optional `customer_note`, and `items: [{ product_id, quantity }]`. Prices are read from the database, not accepted from the browser. Product rows are locked and stock decremented in a database transaction; an order code is returned with payment status `pending`.

## Important
This function reserves stock at order creation. Add a trusted cancellation/refund workflow that releases reserved stock before accepting real orders. Apply rate limiting/CAPTCHA and privacy/retention controls before public launch. Test RLS grants and policies in Supabase before production. Keep all secrets out of commits.
