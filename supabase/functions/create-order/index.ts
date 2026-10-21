import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method tidak diizinkan" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return reply({ error: "Backend belum dikonfigurasi" }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: "JSON tidak valid" }, 400); }

  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerContact = typeof body.customer_contact === "string" ? body.customer_contact.trim() : "";
  const customerNote = typeof body.customer_note === "string" ? body.customer_note : "";
  const items = body.items;
  if (customerName.length < 2 || customerName.length > 100 ||
      customerContact.length < 3 || customerContact.length > 160 ||
      customerNote.length > 1000 || !Array.isArray(items) || items.length < 1 || items.length > 10) {
    return reply({ error: "Data pesanan tidak valid" }, 400);
  }

  const normalized = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.product_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 ||
        seen.has(item.product_id)) {
      return reply({ error: "Item pesanan tidak valid atau duplikat" }, 400);
    }
    seen.add(item.product_id);
    normalized.push({ product_id: item.product_id, quantity: item.quantity });
  }

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("create_primehub_order", {
    p_customer_name: customerName,
    p_customer_contact: customerContact,
    p_customer_note: customerNote,
    p_items: normalized,
  });
  if (error) {
    const safeMessage = /stok|produk|jumlah|pesanan|nama|kontak|catatan|total/i.test(error.message)
      ? error.message : "Pesanan belum dapat dibuat";
    return reply({ error: safeMessage }, 400);
  }
  return reply({ order: data }, 201);
});
