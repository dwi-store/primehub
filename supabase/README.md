# PrimeHub backend foundation

This directory is the first backend preparation step for the existing GitHub Pages frontend. It does **not** make checkout, admin, inventory, or payments live yet.

## Architecture decision

- Keep the current Next.js storefront deployed as a static site on GitHub Pages.
- Use Supabase (PostgreSQL + Auth + Edge Functions) as a separate backend.
- Keep all Supabase service-role keys and payment credentials server-side only. Never commit them to GitHub or expose them in browser code.
- Until DANA merchant access is approved, payment status must remain pending until an authorized admin verifies the transfer through the merchant's legitimate account. Do not display an automatic payment-success state or ask customers to send PINs, OTPs, passwords, or other authentication secrets.

## Database schema

1. Create a Supabase project.
2. Open the SQL Editor and review then run `schema.sql`.
3. Create the initial admin user using Supabase Auth.
4. Have the project owner assign `profiles.is_admin = true` to that user's UUID using the trusted SQL Editor. Never allow users to set this field through public signup or a browser form.
5. Add only non-secret public project settings to the frontend environment/configuration when frontend integration begins. Service-role keys must never be exposed to GitHub Pages.

## Important security boundary

The SQL intentionally does not permit browser clients to create orders/order items or change inventory. Before accepting real orders, implement and test a trusted Edge Function that:
- validates input and retrieves current product prices from the database;
- checks stock and creates the order plus order items in one database transaction;
- generates a unique, non-guessable order code;
- reserves/decrements stock atomically to prevent overselling;
- rate-limits and validates requests;
- exposes customer order lookup without leaking another customer's personal data;
- allows admin-only order and stock operations;
- records payment status changes only through an authenticated admin action or a verified payment provider notification.

## DANA status

No DANA merchant credentials are configured. This project is **not** connected to DANA and cannot accept or verify DANA payments automatically yet. The official DANA onboarding process requires developer credentials, sandbox testing, and approval before production credentials/live payments. Until then, manual transfer handling is a separate, explicitly pending workflow; an uploaded receipt or browser redirect must never be treated as proof of payment.

Official DANA references:
- https://dashboard.dana.id/api-docs-v2/guide/getting-started/integration-overview
- https://dashboard.dana.id/api-docs-v2/api

## Required test gates before launch

- RLS: anonymous users can read active products only; they cannot read orders or change stock.
- Admin: a non-admin cannot manage products/orders or change admin privileges.
- Orders: forged prices, negative quantities, zero stock, duplicate submissions, and concurrent purchases are rejected safely.
- Privacy: customers cannot view another customer's order or contact details.
- Payments: pending remains pending until verified; fake redirects and forged client requests do not mark an order paid.
- Build: run the frontend build and deploy checks; then test the deployed GitHub Pages frontend against the separate backend.

Do not advertise this foundation as a functioning store until the Edge Functions, frontend integration, and tests are implemented and verified.
