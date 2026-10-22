# PrimeHub Supabase backend

This directory contains the database, admin, and checkout backend source used by PrimeHub's static storefront.

## Live project status (22 October 2026)

- The four core tables exist and have Row Level Security enabled. The profile bootstrap, stock cancellation, and checkout-security/rate-limit migrations have been applied to the linked Supabase project.
- The `create-order` Edge Function is deployed and active.
- The project still has no Auth users, product records, or orders. The storefront will show live products only after actual product names, prices, stock, and active status have been entered.
- DANA is not integrated for automatic payment verification. Payment remains pending until the store owner verifies it through the official account.

## Architecture and safety

- The Next.js storefront is deployed as a static site on GitHub Pages; Supabase provides Postgres, Auth, and Edge Functions.
- The checkout function calculates prices from the database and reserves stock atomically. It validates inputs, restricts browser origins, and enforces per-client request limits in a private table.
- Keep service-role keys and payment credentials on the server only. The workflow uses a public publishable key for the browser; never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_*` variable.
- The admin panel checks the signed-in user's `profiles.is_admin` flag and uses RLS for product/order operations. Only the project owner may grant admin rights.
- Never mark an order paid based on a browser redirect or uploaded receipt alone. Never ask customers for a DANA PIN, OTP, or account password.

## Database setup

For a new project, run `schema.sql`. To recreate this setup on a database where the base tables already exist, see `SETUP.md` and the profile bootstrap, API permission, order creation, stock cancellation, checkout rate-limit, and private rate-limit RLS policy migrations.

## Pre-launch checks

- Create an owner/admin Auth account, assign the role securely, and verify non-admin denial.
- Add accurate products/prices/stock and test out-of-stock, forged input, duplicate, and concurrent requests.
- Rate limiting is enabled; CAPTCHA/Turnstile and privacy/retention controls remain recommended before broad public traffic.
- DANA automatic payments require merchant onboarding, credentials, verified callbacks, and sandbox testing.
