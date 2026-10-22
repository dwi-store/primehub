# PrimeHub Supabase setup

## Live project status (22 October 2026)
The connected `primehub` project in Singapore has the four core tables (`profiles`, `products`, `orders`, `order_items`) with Row Level Security enabled. The profile bootstrap, stock-on-cancellation, and checkout security/rate-limit migrations have been applied directly to the linked database. The `create-order` Edge Function is deployed and active.

The project has the active Canva Premium and CapCut Premium catalog entries. Admin login requires an owner account in Supabase Auth with its admin role assigned; order activity is stored in the `orders` table. Automatic DANA verification is not integrated; new orders remain pending until an authorized admin verifies payment.

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


## Telegram bot order notifications (recommended)
The existing \`create-order\` Edge Function can send a private Telegram message after a successful checkout. Checkout, price verification, stock reservation, and payment status are unchanged. If Telegram is not configured or Telegram is temporarily unavailable, the order remains created normally.

1. In Telegram, open **@BotFather**, send \`/newbot\`, follow the prompts, and save the bot token privately.
2. Open your newly created bot and press **Start** (or send \`/start\`) so it can message you.
3. Get your personal Telegram chat ID by messaging **@userinfobot** and reading the numeric ID it returns. For a private one-to-one chat, use that numeric ID.
4. Open **Supabase Dashboard → Edge Functions → Secrets** for this project and add the following secrets:

| Secret name | Value |
|---|---|
| \`TELEGRAM_BOT_TOKEN\` | Token created by @BotFather |
| \`TELEGRAM_CHAT_ID\` | Your numeric Telegram user/chat ID |

Never commit or send the bot token in chat, and do not put it in frontend code or a \`NEXT_PUBLIC_*\` variable. After setting these secrets, create a normal test order and confirm the alert arrives. The response includes \`notifications.telegram: "sent"\`, \`"not_configured"\`, or \`"failed"\`; notification errors do not fail checkout.

## WhatsApp order notifications (optional)
The `create-order` Edge Function can send a WhatsApp alert to the store admin after a successful order. The order is still created if WhatsApp is not configured or the provider is temporarily unavailable.

This integration uses Meta's WhatsApp Business Cloud API and an approved message template. In Meta's WhatsApp Manager, create/approve a template named `primehub_order_alert` in Indonesian (`id`) with these four body parameters in this exact order:
1. `{{1}}` — order code
2. `{{2}}` — customer name
3. `{{3}}` — customer contact
4. `{{4}}` — order total (IDR)

Suggested template body:
```text
Pesanan baru PrimeHub!
Kode: {{1}}
Pelanggan: {{2}}
Kontak: {{3}}
Total: {{4}}
```

Then open **Supabase Dashboard → Edge Functions → Secrets** for this project and add the following production secrets. Never place these values in GitHub, frontend environment variables prefixed with `NEXT_PUBLIC_`, or customer-facing code.

| Secret name | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta system-user access token with `whatsapp_business_messaging` permission |
| `WHATSAPP_PHONE_NUMBER_ID` | ID of the registered WhatsApp Business sender number |
| `WHATSAPP_ADMIN_RECIPIENT` | Admin's destination WhatsApp number, digits only with country code (example format: `6281234567890`) |
| `WHATSAPP_ORDER_TEMPLATE` | Approved template name; default is `primehub_order_alert` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code; default is `id` |
| `WHATSAPP_GRAPH_API_VERSION` | Graph API version; default is `v26.0` |

After the secrets and approved template are set, submit one test order and confirm the WhatsApp notification arrives. The function response includes `notification: "sent"`, `"not_configured"`, or `"failed"`; no access token or customer details are written to notification logs.

## Launch safeguards
The cancellation migration returns stock only when an unpaid/failed order is cancelled; cancelled orders cannot be reopened. In the admin panel, use **Batalkan** for unpaid/failed orders. Use **Hapus permanen** only after cancellation when payment status is still pending or failed; this cascades to the order items. The live RLS policy restricts delete permission to admins and those cancelled unpaid/failed records. Paid or refunded orders are intentionally retained as financial history. Paid-order refunds and inventory decisions require manual review. The public `create-order` function has `verify_jwt = false` because customers do not sign in; it allows 12 requests per minute and 80 per day per detected client IP. It stores HMAC fingerprints in a private schema rather than raw IP addresses. CAPTCHA/Turnstile and privacy/retention controls are still recommended before broad public traffic. Run the Supabase security advisors and end-to-end checkout tests before launch. Keep all secrets out of commits.
