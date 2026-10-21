"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_idr: number;
  stock: number;
  is_active: boolean;
};

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_contact: string;
  total_idr: number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", description: "", category: "Produktivitas", price_idr: "0", stock: "0", is_active: true });

  const configured = Boolean(supabaseUrl && supabaseKey);

  async function api(path: string, init: RequestInit = {}, accessToken = token) {
    if (!supabaseUrl || !supabaseKey) throw new Error("Konfigurasi Supabase belum tersedia di environment frontend.");
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken || supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(init.headers || {})
      }
    });
    const body = await response.text();
    if (!response.ok) throw new Error(body || `Permintaan gagal (${response.status})`);
    return body ? JSON.parse(body) : [];
  }

  async function loadData(accessToken = token) {
    const [p, o] = await Promise.all([
      api("products?select=*&order=created_at.desc", {}, accessToken),
      api("orders?select=id,order_code,customer_name,customer_contact,total_idr,payment_status,order_status,created_at&order=created_at.desc&limit=50", {}, accessToken)
    ]);
    setProducts(p);
    setOrders(o);
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi.");
      }
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: supabaseKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || "Login gagal.");
      if (!data.access_token || !data.user?.id) throw new Error("Respons login tidak lengkap.");

      // Check the server-controlled profile role before revealing the admin dashboard.
      const roleResponse = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(data.user.id)}&select=is_admin`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${data.access_token}` } }
      );
      const roleData = await roleResponse.json();
      if (!roleResponse.ok) {
        throw new Error("Tidak dapat memverifikasi hak admin. Periksa kebijakan akses profiles di Supabase.");
      }
      if (!Array.isArray(roleData) || roleData[0]?.is_admin !== true) {
        throw new Error("Login berhasil, tetapi akun ini belum memiliki hak admin PrimeHub.");
      }

      // Load protected data before setting the UI to an authenticated state.
      await loadData(data.access_token);
      setToken(data.access_token);
      setUserId(data.user.id);
      setPassword("");
      setNotice("Login admin berhasil.");
    } catch (error) {
      setToken("");
      setUserId("");
      setProducts([]);
      setOrders([]);
      setNotice(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    setEditing(null);
    setForm({ slug: "", name: "", description: "", category: "Produktivitas", price_idr: "0", stock: "0", is_active: true });
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({ slug: product.slug, name: product.name, description: product.description, category: product.category, price_idr: String(product.price_idr), stock: String(product.stock), is_active: product.is_active });
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const payload = { ...form, price_idr: Number(form.price_idr), stock: Number(form.stock), updated_at: new Date().toISOString() };
      if (editing) await api(`products?id=eq.${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("products", { method: "POST", body: JSON.stringify(payload) });
      await loadData();
      startNew();
      setNotice("Produk berhasil disimpan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan produk.");
    } finally { setBusy(false); }
  }

  async function updateOrder(order: Order, field: "payment_status" | "order_status", value: string) {
    setBusy(true); setNotice("");
    try {
      await api(`orders?id=eq.${order.id}`, { method: "PATCH", body: JSON.stringify({ [field]: value, updated_at: new Date().toISOString() }) });
      await loadData();
      setNotice(`Status pesanan ${order.order_code} diperbarui. Pastikan status pembayaran hanya diubah setelah transfer benar-benar diverifikasi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal memperbarui pesanan.");
    } finally { setBusy(false); }
  }

  function signOut() {
    setToken(""); setUserId(""); setProducts([]); setOrders([]); setNotice("Sesi admin dihapus dari halaman ini.");
  }

  const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return <main style={{ minHeight: "100vh", background: "#f6f7fb", color: "#10162a", padding: "28px 16px 60px" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div><p style={{ margin: 0, color: "#5c5de8", fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>PRIMEHUB / ADMIN</p><h1 style={{ margin: "8px 0", fontSize: 32 }}>Panel pengelolaan</h1><p style={{ margin: 0, color: "#687087" }}>Katalog, stok, dan pesanan dalam satu tempat.</p></div>
        <Link href="/" style={{ color: "#5c5de8", fontWeight: 700 }}>← Kembali ke toko</Link>
      </header>

      {!token ? <form onSubmit={signIn} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e8eaf1", maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>Login admin</h2>
        <p style={{ color: "#687087", lineHeight: 1.6 }}>Gunakan akun yang dibuat di Supabase Auth dan yang profilnya sudah diberi hak admin oleh pemilik proyek.</p>
        {!configured && <p style={{ background: "#fff4db", padding: 12, borderRadius: 10 }}>Supabase belum dikonfigurasi pada frontend. Panel tidak akan tersambung sampai URL proyek dan anon key publik ditambahkan sebagai environment variables saat build.</p>}
        <label style={{ display: "block", fontWeight: 700, marginTop: 14 }}>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label>
        <label style={{ display: "block", fontWeight: 700, marginTop: 14 }}>Password<input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label>
        <button disabled={busy || !configured} style={buttonStyle}>{busy ? "Memproses…" : "Login"}</button>
      </form> : <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}><span style={{ color: "#687087", fontSize: 13 }}>Sesi aktif · {userId}</span><button onClick={signOut} style={secondaryButtonStyle}>Keluar</button></div>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Kelola produk</h2>
          <form onSubmit={saveProduct} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <label style={labelStyle}>Nama produk<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Slug unik<input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} style={inputStyle} /></label>
            <label style={labelStyle}>Kategori<input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Harga (IDR)<input required type="number" min="0" step="1" value={form.price_idr} onChange={e => setForm({ ...form, price_idr: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Stok<input required type="number" min="0" step="1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Deskripsi<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} /></label>
            <label style={{ ...labelStyle, display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Aktif di katalog</label>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}><button disabled={busy} style={buttonStyle}>{editing ? "Simpan perubahan" : "Tambah produk"}</button>{editing && <button type="button" onClick={startNew} style={secondaryButtonStyle}>Batal</button>}</div>
          </form>
          <div style={{ overflowX: "auto", marginTop: 20 }}><table style={tableStyle}><thead><tr><th style={thStyle}>Produk</th><th style={thStyle}>Harga</th><th style={thStyle}>Stok</th><th style={thStyle}>Status</th><th style={thStyle}>Aksi</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td style={tdStyle}><strong>{p.name}</strong><br /><small>{p.slug}</small></td><td style={tdStyle}>{money(p.price_idr)}</td><td style={tdStyle}>{p.stock}</td><td style={tdStyle}>{p.is_active ? "Aktif" : "Nonaktif"}</td><td style={tdStyle}><button onClick={() => startEdit(p)} style={secondaryButtonStyle}>Edit</button></td></tr>)}</tbody></table>{products.length === 0 && <p style={{ color: "#687087" }}>Belum ada produk atau akun ini belum memiliki izin membaca katalog.</p>}</div>
        </section>
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Pesanan terbaru</h2>
          <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th style={thStyle}>Kode / tanggal</th><th style={thStyle}>Pelanggan</th><th style={thStyle}>Total</th><th style={thStyle}>Pembayaran</th><th style={thStyle}>Pesanan</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td style={tdStyle}><strong>{o.order_code}</strong><br /><small>{new Date(o.created_at).toLocaleString("id-ID")}</small></td><td style={tdStyle}>{o.customer_name}<br /><small>{o.customer_contact}</small></td><td style={tdStyle}>{money(o.total_idr)}</td><td style={tdStyle}><select value={o.payment_status} onChange={e => updateOrder(o, "payment_status", e.target.value)} style={selectStyle}><option value="pending">Menunggu</option><option value="paid">Terverifikasi lunas</option><option value="failed">Gagal</option><option value="refunded">Dikembalikan</option></select></td><td style={tdStyle}><select value={o.order_status} onChange={e => updateOrder(o, "order_status", e.target.value)} style={selectStyle}><option value="pending_payment">Menunggu pembayaran</option><option value="processing">Diproses</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></select></td></tr>)}</tbody></table>{orders.length === 0 && <p style={{ color: "#687087" }}>Belum ada pesanan.</p>}</div>
        </section>
      </>}
      {notice && <p role="status" style={{ marginTop: 18, padding: 14, background: "white", border: "1px solid #e8eaf1", borderRadius: 12, overflowWrap: "anywhere" }}>{notice}</p>}
      <p style={{ color: "#687087", fontSize: 12, lineHeight: 1.6, marginTop: 24 }}>Keamanan: panel ini menggunakan Supabase Auth dan RLS. Jangan berikan akses admin kepada akun publik. Status lunas hanya boleh dipilih setelah transfer diverifikasi dari sumber pembayaran resmi.</p>
    </div>
  </main>;
}

const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 6, padding: "11px 12px", border: "1px solid #dfe2ec", borderRadius: 9, background: "white", color: "#10162a" };
const buttonStyle: React.CSSProperties = { padding: "12px 16px", marginTop: 16, border: 0, borderRadius: 9, background: "#5c5de8", color: "white", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #dfe2ec", borderRadius: 8, background: "white", color: "#10162a", fontWeight: 700, cursor: "pointer" };
const panelStyle: React.CSSProperties = { background: "white", padding: 20, borderRadius: 18, border: "1px solid #e8eaf1", marginBottom: 18 };
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 13 };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
const thStyle: React.CSSProperties = { padding: "12px 10px", borderBottom: "1px solid #e8eaf1", fontSize: 12, color: "#687087", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "12px 10px", borderBottom: "1px solid #f0f1f5", fontSize: 13, verticalAlign: "top" };
const selectStyle: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #dfe2ec", background: "white" };
