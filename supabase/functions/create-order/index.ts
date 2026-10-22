import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://dwi-store.github.io",
  "http://localhost:3000",
]);

function responseHeaders(origin: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function reply(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  const headers = responseHeaders(req.headers.get("origin"));
  for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value);
  return new Response(JSON.stringify(body), { status, headers });
}

async function fingerprintClient(clientIp: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(clientIp));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return reply(req, { error: "Origin tidak diizinkan" }, 403);
  }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(origin) });
  if (req.method !== "POST") return reply(req, { error: "Method tidak diizinkan" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return reply(req, { error: "Backend belum dikonfigurasi" }, 503);

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return reply(req, { error: "Permintaan terlalu besar" }, 413);
  }

  // Cloudflare supplies this request header at the edge; do not use a client-supplied
  // x-forwarded-for value for security-sensitive rate limiting.
  const clientIp = req.headers.get("cf-connecting-ip")?.trim();
  if (!clientIp || clientIp.length > 45 || !/^[0-9a-fA-F:.]+$/.test(clientIp)) {
    return reply(req, { error: "Tidak dapat memverifikasi asal permintaan. Silakan coba lagi." }, 503);
  }

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const clientHash = await fingerprintClient(clientIp, secret);
    const { data: allowed, error: limitError } = await admin.rpc("consume_primehub_checkout_limit", {
      p_client_hash: clientHash,
    });
    if (limitError) {
      console.error("Checkout rate-limit check failed:", limitError.message);
      return reply(req, { error: "Layanan pesanan belum siap. Silakan coba lagi nanti." }, 503);
    }
    if (allowed !== true) {
      return reply(req, { error: "Terlalu banyak permintaan. Coba lagi sebentar." }, 429, { "Retry-After": "60" });
    }

    let body: Record<string, unknown>;
    try {
      const rawBody = await req.text();
      if (rawBody.length > 32_768) return reply(req, { error: "Permintaan terlalu besar" }, 413);
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return reply(req, { error: "Format pesanan tidak valid" }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return reply(req, { error: "JSON tidak valid" }, 400);
    }

    const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
    const customerContact = typeof body.customer_contact === "string" ? body.customer_contact.trim() : "";
    const customerNote = typeof body.customer_note === "string" ? body.customer_note : "";
    const items = body.items;
    if (customerName.length < 2 || customerName.length > 100 ||
        customerContact.length < 3 || customerContact.length > 160 ||
        customerNote.length > 1000 || !Array.isArray(items) || items.length < 1 || items.length > 10) {
      return reply(req, { error: "Data pesanan tidak valid" }, 400);
    }

    const normalized: Array<{ product_id: string; quantity: number }> = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (!item || typeof item.product_id !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 ||
          seen.has(item.product_id)) {
        return reply(req, { error: "Item pesanan tidak valid atau duplikat" }, 400);
      }
      seen.add(item.product_id);
      normalized.push({ product_id: item.product_id, quantity: item.quantity });
    }

    const { data, error } = await admin.rpc("create_primehub_order", {
      p_customer_name: customerName,
      p_customer_contact: customerContact,
      p_customer_note: customerNote,
      p_items: normalized,
    });
    if (error) {
      console.error("Order creation failed:", error.message);
      const safeMessage = /stok|produk|jumlah|pesanan|nama|kontak|catatan|total/i.test(error.message)
        ? error.message
        : "Pesanan belum dapat dibuat";
      return reply(req, { error: safeMessage }, 400);
    }
    return reply(req, { order: data }, 201);
  } catch (error) {
    console.error("Unexpected create-order failure:", error);
    return reply(req, { error: "Terjadi kesalahan saat membuat pesanan." }, 500);
  }
});
