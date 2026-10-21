# PrimeHub Supabase backend

This directory contains the database, admin, and checkout backend source used by the PrimeHub static storefront. The frontend build may succeed even when the Supabase project has not yet been configured, so a successful GitHub Pages deployment alone does not prove that live orders or admin features are active.

## Architecture and safety

- The Next.js storefront is deployed as a static site on GitHub Pages.
- Supabase provides PostgreSQL, Auth, and Edge Functions.
- Keep all service-role keys and payment credentials server-side. Never commit them to GitHub or expose them in browser code.
- Orders remain pending until an authorized admin verifies payment. DANA is not integrated automatically yet; do not treat a browser redirect or uploaded receipt as payment proof.
- Never ask customers for a DANA PIN, OTP, account password, or other authentication secret.

## Database setup

1. For a new Supabase project, run `schema.sql` in SQL Editor.
2. For an existing project where the schema is already installed, run migrations in `SETUP.md`, including `20261022_profile_bootstrap.sql` and the API permission, order creation, and stock cancellation migrations.
3. Create/confirm the admin Auth user, then grant the admin role only as the project owner. See the exact SQL in `SETUP.md`.
4. Add only public Supabase project URL and publishable/anon key to the frontend build configuration. Never expose `SUPABASE_SERVICE_ROLE_KEY` via a `NEXT_PUBLIC_*` variable.

## Current backend behavior

- The browser may read active products only through RLS.
- Order creation runs in the trusted `create-order` Edge Function and an atomic database function. Prices are fetched from the database, stock is checked/locked, and status starts as pending.
- Admin access checks the Auth user's `profiles.is_admin` flag; products and orders remain protected by RLS.
- DANA payments are not auto-verified. Manual status changes must follow real payment verification through the official account.

## Pre-launch checks

- Test RLS with anonymous, normal authenticated, and admin users.
- Check forged/invalid order quantities, out-of-stock products, duplicate submissions, and concurrent requests.
- Add rate limiting/CAPTCHA and privacy/retention controls before public traffic.
- Confirm the deployed site uses the intended Supabase project and public key, and run an end-to-end test before advertising the store as live.
