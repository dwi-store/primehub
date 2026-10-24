"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image_url: string | null;
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
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "cancelled">("all");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", description: "", category: "Produktivitas", image_url: "", price_idr: "0", stock: "0", is_active: true });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [newOrderAlerts, setNewOrderAlerts] = useState<Order[]>([]);
  const seenOrderIds = useRef<Set<string>>(new Set());
  const initializedOrderWatch = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

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
    return { products: p as Product[], orders: o as Order[] };
  }

  // Watch for new orders while the admin panel is open; the first load is
  // treated as history so existing orders do not trigger false alerts.
  useEffect(() => {
    if (!token || !initializedOrderWatch.current || !supabaseUrl || !supabaseKey) return;
    let cancelled = false;
    let checking = false;

    async function checkForNewOrders() {
      if (cancelled || checking) return;
      checking = true;
      try {
        const latest = await api(
          "orders?select=id,order_code,customer_name,customer_contact,total_idr,payment_status,order_status,created_at&order=created_at.desc&limit=50",
          {},
          token
        ) as Order[];
        if (cancelled) return;

        const newOrders = latest.filter(order => !seenOrderIds.current.has(order.id));
        seenOrderIds.current = new Set(latest.map(order => order.id));
        setOrders(latest);

        if (newOrders.length > 0) {
          setNewOrderAlerts(previous => [...newOrders, ...previous].slice(0, 10));
          const first = newOrders[0];
          const body = newOrders.length === 1
            ? `${first.order_code} · ${first.customer_name} · ${formatMoney(first.total_idr)}`
            : `${newOrders.length} pesanan baru masuk ke UPPRIME.`;
          setNotice(`🔔 ${newOrders.length} pesanan baru masuk. Lihat bagian notifikasi di panel admin.`);

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(newOrders.length === 1 ? "Pesanan baru UPPRIME" : `${newOrders.length} pesanan baru UPPRIME`, { body });
          }
        }
      } catch {
        // Keep existing order data visible; the next interval will retry.
      } finally {
        checking = false;
      }
    }

    const intervalId = window.setInterval(() => { void checkForNewOrders(); }, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Konfigurasi Supabase belum tersedia saat build situs.");
      }
      const endpoint = supabaseUrl + "/auth/v1/token?grant_type=password";
      // Mobile keyboards/autofill can add spaces or alter email casing; normalize email only.
      const payload = { email: email.trim().toLowerCase(), password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { apikey: supabaseKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorText = String(data.msg || data.message || data.error_description || data.error || "");
        if (/email not confirmed/i.test(errorText) || data.code === "email_not_confirmed") {
          throw new Error("Email belum dikonfirmasi. Gunakan email admin yang sudah aktif; akun baru tidak otomatis menjadi admin.");
        }
        if (/invalid login credentials/i.test(errorText) || data.code === "invalid_credentials") {
          throw new Error("Email atau sandi tidak cocok. Periksa ejaan email, lalu gunakan akun admin yang sama dengan di laptop.");
        }
        throw new Error(errorText || "Login gagal. Periksa email dan sandi.");
      }

      if (!data.access_token || !data.user?.id) throw new Error("Respons login tidak lengkap.");

      // Read the server-controlled role before revealing protected admin data.
      const roleResponse = await fetch(
        supabaseUrl + "/rest/v1/profiles?id=eq." + encodeURIComponent(data.user.id) + "&select=is_admin",
        { headers: { apikey: supabaseKey, Authorization: "Bearer " + data.access_token } }
      );
      const roleData = await roleResponse.json().catch(() => []);
      if (!roleResponse.ok) {
        throw new Error("Tidak dapat memverifikasi hak admin. Periksa kebijakan akses profiles di Supabase.");
      }
      if (!Array.isArray(roleData) || roleData[0]?.is_admin !== true) {
        throw new Error("Login berhasil, tetapi akun ini belum memiliki hak admin UPPRIME.");
      }

      const initialData = await loadData(data.access_token);
      seenOrderIds.current = new Set(initialData.orders.map(order => order.id));
      initializedOrderWatch.current = true;
      setNewOrderAlerts([]);
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
    setForm({ slug: "", name: "", description: "", category: "Produktivitas", image_url: "", price_idr: "0", stock: "0", is_active: true });
    setImageFile(null);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({ slug: product.slug, name: product.name, description: product.description, category: product.category, image_url: product.image_url || "", price_idr: String(product.price_idr), stock: String(product.stock), is_active: product.is_active });
    setImageFile(null);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      if (!supabaseUrl || !supabaseKey) throw new Error("Konfigurasi Supabase belum tersedia.");
      let imageUrl = form.image_url;
      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) throw new Error("Pilih file gambar.");
        if (imageFile.size > 5 * 1024 * 1024) throw new Error("Ukuran foto maksimal 5 MB.");
        const extension = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const objectPath = `${crypto.randomUUID()}.${extension}`;
        const upload = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${objectPath}`, {
          method: "POST",
          headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, "Content-Type": imageFile.type, "x-upsert": "true" },
          body: imageFile
        });
        if (!upload.ok) throw new Error("Foto gagal diunggah: " + (await upload.text()));
        imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`;
      }
      const payload = { ...form, image_url: imageUrl || null, price_idr: Number(form.price_idr), stock: Number(form.stock), updated_at: new Date().toISOString() };
      if (editing) await api(`products?id=eq.${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("products", { method: "POST", body: JSON.stringify(payload) });
      await loadData();
      startNew();
      setNotice("Produk berhasil disimpan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan produk.");
    } finally { setBusy(false); }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}" secara permanen? Produk ini akan langsung hilang dari katalog toko. Pesanan lama tetap menyimpan ringkasan produknya.`
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    try {
      await api(`products?id=eq.${encodeURIComponent(product.id)}`, { method: "DELETE" });
      if (editing?.id === product.id) startNew();
      await loadData();
      setNotice(`Produk "${product.name}" berhasil dihapus dari katalog.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menghapus produk. Periksa izin admin dan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function adjustStock(product: Product, delta: number) {
    const nextStock = product.stock + delta;
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setNotice("Stok tidak boleh kurang dari 0.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await api(`products?id=eq.${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock: nextStock, updated_at: new Date().toISOString() })
      });
      await loadData();
      setNotice(`Stok ${product.name} berhasil ${delta > 0 ? "ditambah" : "dikurangi"} menjadi ${nextStock}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal mengubah stok.");
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(order: Order, field: "payment_status" | "order_status", value: string) {
    if (field === "order_status" && value === "cancelled") {
      await cancelOrder(order);
      return;
    }
    if (field === "payment_status" && order.order_status === "cancelled" && value === "paid") {
      setNotice("Pesanan yang sudah dibatalkan tidak bisa ditandai lunas. Periksa transaksi secara manual sebelum mengubah status.");
      return;
    }
    setBusy(true); setNotice("");
    try {
      await api(`orders?id=eq.${order.id}`, { method: "PATCH", body: JSON.stringify({ [field]: value, updated_at: new Date().toISOString() }) });
      await loadData();
      setNotice(`Status pesanan ${order.order_code} diperbarui. Pastikan status pembayaran hanya diubah setelah transfer benar-benar diverifikasi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal memperbarui pesanan.");
    } finally { setBusy(false); }
  }

  async function cancelOrder(order: Order) {
    if (order.order_status === "cancelled") {
      setNotice(`Pesanan ${order.order_code} sudah dibatalkan.`);
      return;
    }
    if (order.payment_status === "paid" || order.payment_status === "refunded" || order.order_status === "completed") {
      setNotice("Pesanan yang sudah lunas, dikembalikan dananya, atau selesai perlu ditangani manual. Jangan membatalkannya lewat tombol ini.");
      return;
    }

    const confirmed = window.confirm(
      `Batalkan pesanan ${order.order_code} milik ${order.customer_name}? Jika pembayaran masih menunggu atau gagal, stok yang dipesan akan dikembalikan otomatis.`
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    try {
      await api(`orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ order_status: "cancelled", updated_at: new Date().toISOString() })
      });
      await loadData();
      setNotice(`Pesanan ${order.order_code} dibatalkan. Stok akan dikembalikan otomatis jika pesanan belum dibayar atau pembayarannya gagal.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal membatalkan pesanan.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(order: Order) {
    if (order.order_status !== "cancelled" || !["pending", "failed"].includes(order.payment_status)) {
      setNotice("Hanya pesanan yang sudah dibatalkan dan belum dibayar atau berstatus pembayaran gagal yang dapat dihapus permanen. Pesanan lunas/refund disimpan sebagai catatan.");
      return;
    }

    const confirmed = window.confirm(
      `HAPUS PERMANEN pesanan ${order.order_code}? Data pesanan dan rincian itemnya akan dihapus dan tidak dapat dipulihkan. Stok tidak akan diubah lagi.`
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    try {
      await api(`orders?id=eq.${encodeURIComponent(order.id)}&order_status=eq.cancelled&payment_status=in.(pending,failed)`, {
        method: "DELETE"
      });
      await loadData();
      setNotice(`Pesanan ${order.order_code} berhasil dihapus permanen.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menghapus pesanan. Pastikan pesanan sudah dibatalkan dan belum dibayar.");
    } finally {
      setBusy(false);
    }
  }

  async function enableOrderNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotice("Browser ini tidak mendukung notifikasi desktop. Notifikasi baru tetap terlihat di panel admin selama halaman terbuka.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotice(permission === "granted"
        ? "Notifikasi browser aktif. Panel ini akan memberi tahu saat pesanan baru masuk selama halaman admin terbuka."
        : permission === "denied"
          ? "Izin notifikasi diblokir browser. Ubah izin situs menjadi Izinkan agar notifikasi desktop dapat muncul."
          : "Notifikasi belum diizinkan. Kamu tetap melihat notifikasi di panel admin selama halaman terbuka.");
    } catch {
      setNotice("Izin notifikasi tidak dapat diminta. Kamu tetap melihat notifikasi di panel admin selama halaman terbuka.");
    }
  }

  function signOut() {
    setToken("");
    setUserId("");
    setProducts([]);
    setOrders([]);
    setNewOrderAlerts([]);
    seenOrderIds.current = new Set();
    initializedOrderWatch.current = false;
    setNotice("Sesi admin dihapus dari halaman ini.");
  }

  const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  const formatMoney = money;
  const visibleOrders = orders.filter(order => orderFilter === "all" || (orderFilter === "cancelled" ? order.order_status === "cancelled" : order.order_status !== "cancelled"));

  return <main style={{ minHeight: "100vh", background: "#f6f7fb", color: "#10162a", padding: "28px 16px 60px" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <div><p style={{ margin: 0, color: "#5c5de8", fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>UPPRIME / ADMIN</p><h1 style={{ margin: "8px 0", fontSize: 32 }}>Panel pengelolaan</h1><p style={{ margin: 0, color: "#687087" }}>Katalog, stok, dan pesanan dalam satu tempat.</p></div>
        <Link href="/" style={{ color: "#5c5de8", fontWeight: 700 }}>← Kembali ke toko</Link>
      </header>

      {!token ? <form onSubmit={signIn} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e8eaf1", maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>Login admin</h2>
        <p style={{ color: "#687087", lineHeight: 1.6 }}>Masuk memakai akun admin UPPRIME yang sama dengan di laptop. Akun baru tidak bisa menjadi admin melalui halaman ini.</p>
        {!configured && <p style={{ background: "#fff4db", padding: 12, borderRadius: 10 }}>Supabase belum dikonfigurasi pada frontend. Panel tidak akan tersambung sampai URL proyek dan anon key publik ditambahkan sebagai environment variables saat build.</p>}
        <label style={{ display: "block", fontWeight: 700, marginTop: 14 }}>Email<input required type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label>{email.trim().toLowerCase().endsWith("@gmai.com") && <p role="status" style={{ color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 9, padding: 10, fontSize: 12, lineHeight: 1.5 }}>Periksa ejaan email: alamat ini berakhiran @gmai.com. Jika memakai Gmail biasa, domainnya biasanya @gmail.com.</p>}
        <label style={{ display: "block", fontWeight: 700, marginTop: 14 }}>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label>
        <button disabled={busy || !configured} style={buttonStyle}>{busy ? "Memproses…" : "Login admin"}</button>
      </form> : <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div><span style={{ color: "#687087", fontSize: 13, display: "block" }}>Sesi aktif · {userId}</span><small style={{ color: "#687087" }}>Pemeriksaan pesanan otomatis setiap 12 detik saat panel ini terbuka.</small></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" disabled={notificationPermission === "unsupported"} onClick={enableOrderNotifications} style={notificationPermission === "granted" ? enabledButtonStyle : secondaryButtonStyle}>{notificationPermission === "granted" ? "✓ Notifikasi aktif" : notificationPermission === "denied" ? "Izin notifikasi diblokir" : notificationPermission === "unsupported" ? "Browser tanpa notifikasi" : "Aktifkan notifikasi"}</button><button onClick={signOut} style={secondaryButtonStyle}>Keluar</button></div>
        </div>
        {newOrderAlerts.length > 0 && <section role="status" aria-live="polite" style={{ ...panelStyle, border: "1px solid #f59e0b", background: "#fffbeb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div><h2 style={{ margin: "0 0 4px", color: "#92400e" }}>🔔 {newOrderAlerts.length} notifikasi pesanan baru</h2><p style={{ margin: 0, color: "#92400e", fontSize: 13 }}>Pesanan terbaru terdeteksi otomatis.</p></div>
            <button type="button" onClick={() => setNewOrderAlerts([])} style={secondaryButtonStyle}>Tandai dibaca</button>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {newOrderAlerts.slice(0, 5).map(order => <div key={order.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 11, background: "white", borderRadius: 9, border: "1px solid #fde68a" }}>
              <span><strong>{order.order_code}</strong><br /><small>{order.customer_name} · {order.customer_contact}</small></span>
              <strong>{money(order.total_idr)}</strong>
            </div>)}
          </div>
        </section>}
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Kelola produk</h2>
          <form onSubmit={saveProduct} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <label style={labelStyle}>Nama produk<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Slug unik<input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} style={inputStyle} /></label>
            <label style={labelStyle}>Kategori<input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Harga (IDR)<input required type="number" min="0" step="1" value={form.price_idr} onChange={e => setForm({ ...form, price_idr: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Stok<input required type="number" min="0" step="1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Deskripsi<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Foto produk (JPG, PNG, WebP, GIF · maks. 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setImageFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: 8 }} />{imageFile && <small style={{ display: "block", marginTop: 6 }}>{imageFile.name}</small>}{!imageFile && form.image_url && <img src={form.image_url} alt="Foto produk saat ini" style={{ display: "block", marginTop: 8, width: 100, height: 76, objectFit: "cover", borderRadius: 8 }} />}</label>
            <label style={{ ...labelStyle, display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Aktif di katalog</label>
            <div style={{ display: "flex", alignItems: "end", gap: 8 }}><button disabled={busy} style={buttonStyle}>{editing ? "Simpan perubahan" : "Tambah produk"}</button>{editing && <button type="button" onClick={startNew} style={secondaryButtonStyle}>Batal</button>}</div>
          </form>
          <div style={{ overflowX: "auto", marginTop: 20 }}><table style={tableStyle}><thead><tr><th style={thStyle}>Foto</th><th style={thStyle}>Produk</th><th style={thStyle}>Harga</th><th style={thStyle}>Stok (− / +)</th><th style={thStyle}>Status</th><th style={thStyle}>Aksi</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td style={tdStyle}>{p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: 64, height: 56, objectFit: "cover", borderRadius: 8 }} /> : <span style={{ color: "#8b91a3" }}>Belum ada</span>}</td><td style={tdStyle}><strong>{p.name}</strong><br /><small>{p.slug}</small></td><td style={tdStyle}>{money(p.price_idr)}</td><td style={tdStyle}><div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 150 }}><button type="button" aria-label={`Kurangi stok ${p.name}`} disabled={busy || p.stock <= 0} onClick={() => adjustStock(p, -1)} style={{ ...secondaryButtonStyle, padding: "6px 11px", minWidth: 34 }}>−</button><strong style={{ minWidth: 24, textAlign: "center" }}>{p.stock}</strong><button type="button" aria-label={`Tambah stok ${p.name}`} disabled={busy} onClick={() => adjustStock(p, 1)} style={{ ...secondaryButtonStyle, padding: "6px 11px", minWidth: 34 }}>+</button><button type="button" disabled={busy} onClick={() => startEdit(p)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>Atur</button></div></td><td style={tdStyle}>{p.is_active ? "Aktif" : "Nonaktif"}</td><td style={tdStyle}><div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}><button type="button" disabled={busy} onClick={() => startEdit(p)} style={secondaryButtonStyle}>Edit produk</button><button type="button" disabled={busy} onClick={() => deleteProduct(p)} style={dangerButtonStyle}>Hapus</button></div></td></tr>)}</tbody></table>{products.length === 0 && <p style={{ color: "#687087" }}>Belum ada produk atau akun ini belum memiliki izin membaca katalog.</p>}</div>
        </section>
        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div><h2 style={{ margin: 0 }}>Kelola pesanan</h2><small style={{ color: "#687087" }}>{visibleOrders.length} dari {orders.length} pesanan · Maksimal 50 terbaru</small></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-label="Filter pesanan">
              <button type="button" onClick={() => setOrderFilter("all")} style={orderFilter === "all" ? filterButtonActiveStyle : secondaryButtonStyle}>Semua</button>
              <button type="button" onClick={() => setOrderFilter("active")} style={orderFilter === "active" ? filterButtonActiveStyle : secondaryButtonStyle}>Aktif</button>
              <button type="button" onClick={() => setOrderFilter("cancelled")} style={orderFilter === "cancelled" ? filterButtonActiveStyle : secondaryButtonStyle}>Dibatalkan</button>
            </div>
          </div>
          <p style={{ margin: "0 0 12px", color: "#687087", fontSize: 12, lineHeight: 1.6 }}>Batalkan pesanan yang belum lunas. Penghapusan permanen hanya tersedia untuk pesanan dibatalkan yang belum dibayar atau pembayarannya gagal; pesanan lunas dan refund tetap tersimpan sebagai riwayat.</p>
          <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th style={thStyle}>Kode / tanggal</th><th style={thStyle}>Pelanggan</th><th style={thStyle}>Total</th><th style={thStyle}>Pembayaran</th><th style={thStyle}>Status pesanan</th><th style={thStyle}>Aksi</th></tr></thead><tbody>{visibleOrders.map(o => <tr key={o.id}><td style={tdStyle}><strong>{o.order_code}</strong><br /><small>{new Date(o.created_at).toLocaleString("id-ID")}</small></td><td style={tdStyle}>{o.customer_name}<br /><small>{o.customer_contact}</small></td><td style={tdStyle}>{money(o.total_idr)}</td><td style={tdStyle}><select value={o.payment_status} disabled={busy} onChange={e => updateOrder(o, "payment_status", e.target.value)} style={selectStyle}><option value="pending">Menunggu</option><option value="paid">Terverifikasi lunas</option><option value="failed">Gagal</option><option value="refunded">Dikembalikan</option></select></td><td style={tdStyle}><select value={o.order_status} disabled={busy} onChange={e => updateOrder(o, "order_status", e.target.value)} style={selectStyle}><option value="pending_payment">Menunggu pembayaran</option><option value="processing">Diproses</option><option value="completed">Selesai</option>{o.order_status === "cancelled" && <option value="cancelled">Dibatalkan</option>}</select></td><td style={tdStyle}><div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 132 }}><button type="button" disabled={busy || o.order_status === "cancelled" || o.order_status === "completed" || o.payment_status === "paid" || o.payment_status === "refunded"} onClick={() => cancelOrder(o)} style={dangerButtonStyle}>Batalkan</button><button type="button" disabled={busy || o.order_status !== "cancelled" || !["pending", "failed"].includes(o.payment_status)} onClick={() => deleteOrder(o)} style={deleteButtonStyle}>Hapus permanen</button></div></td></tr>)}</tbody></table>{visibleOrders.length === 0 && <p style={{ color: "#687087" }}>{orders.length === 0 ? "Belum ada pesanan." : "Tidak ada pesanan pada filter ini."}</p>}</div>
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
const dangerButtonStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #fecaca", borderRadius: 8, background: "#fff1f2", color: "#be123c", fontWeight: 800, cursor: "pointer" };
const deleteButtonStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #fecaca", borderRadius: 8, background: "#be123c", color: "white", fontWeight: 800, cursor: "pointer" };
const filterButtonActiveStyle: React.CSSProperties = { ...secondaryButtonStyle, background: "#5c5de8", borderColor: "#5c5de8", color: "white" };
const enabledButtonStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #a7f3d0", borderRadius: 8, background: "#ecfdf5", color: "#047857", fontWeight: 800, cursor: "pointer" };
const panelStyle: React.CSSProperties = { background: "white", padding: 20, borderRadius: 18, border: "1px solid #e8eaf1", marginBottom: 18 };
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 13 };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
const thStyle: React.CSSProperties = { padding: "12px 10px", borderBottom: "1px solid #e8eaf1", fontSize: 12, color: "#687087", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "12px 10px", borderBottom: "1px solid #f0f1f5", fontSize: 13, verticalAlign: "top" };
const selectStyle: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #dfe2ec", background: "white" };
