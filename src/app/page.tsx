"use client";

import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  app: string;
  category: string;
  description: string;
  price: string;
  price_idr?: number;
  duration: string;
  icon: string;
  methodLabel: string;
  eta: string;
  tone: string;
  featured?: boolean;
  productId?: string;
  stock?: number;
  image_url?: string | null;
};


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const fallbackCatalogServices: Service[] = [
  {
    id: "5a5a10f2-f820-4523-9927-dfd3190d7964",
    productId: "5a5a10f2-f820-4523-9927-dfd3190d7964",
    name: "Canva Premium",
    app: "Canva Premium",
    category: "Desain & Kreativitas",
    description: "Paket Canva Premium untuk 1 bulan. Harga awal sementara; pastikan jenis lisensi dan metode aktivasi yang sah sebelum memproses pesanan.",
    price: money(15000),
    price_idr: 15000,
    duration: "Stok tersedia",
    icon: "🎨",
    methodLabel: "Informasi paket",
    eta: "Mengikuti konfirmasi admin",
    tone: "pink",
    featured: true,
    stock: 10,
    image_url: null
  },
  {
    id: "63c90e10-d8ed-4904-a4ba-28e3239c9ba6",
    productId: "63c90e10-d8ed-4904-a4ba-28e3239c9ba6",
    name: "CapCut Premium",
    app: "CapCut Premium",
    category: "Video & Editing",
    description: "Paket CapCut Premium untuk 1 bulan. Harga awal sementara; pastikan jenis lisensi dan metode aktivasi yang sah sebelum memproses pesanan.",
    price: money(25000),
    price_idr: 25000,
    duration: "Stok tersedia",
    icon: "🎬",
    methodLabel: "Informasi paket",
    eta: "Mengikuti konfirmasi admin",
    tone: "green",
    stock: 10,
    image_url: null
  }
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalMode, setModalMode] = useState<"detail" | "order">("detail");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [requestSummary, setRequestSummary] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ order_code: string; total_idr: number } | null>(null);
  const [catalogServices, setCatalogServices] = useState<Service[]>(fallbackCatalogServices);
  const [catalogStatus, setCatalogStatus] = useState<"unconfigured" | "loading" | "live" | "error">(supabase ? "loading" : "unconfigured");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    let refreshInProgress = false;
    let hasLoadedSuccessfully = false;

    async function loadCatalog() {
      if (cancelled || refreshInProgress) return;
      refreshInProgress = true;
      try {
        const { data, error } = await client!
          .from("products")
          .select("id,name,description,category,image_url,price_idr,stock,is_active,created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const rows = data ?? [];
        const mapped: Service[] = rows.map((product, index) => {
          const category = product.category?.trim() || "Lainnya";
          const categoryLower = category.toLowerCase();
          const style = categoryLower.includes("ai") ? { icon: "✦", tone: "violet" }
            : categoryLower.includes("musik") || categoryLower.includes("music") || categoryLower.includes("hiburan") ? { icon: "🎵", tone: "green" }
            : categoryLower.includes("desain") || categoryLower.includes("kreat") ? { icon: "🎨", tone: "pink" }
            : categoryLower.includes("video") || categoryLower.includes("editing") ? { icon: "🎬", tone: "green" }
            : categoryLower.includes("cloud") || categoryLower.includes("storage") ? { icon: "☁️", tone: "blue" }
            : { icon: "✦", tone: "violet" };
          const price = Number(product.price_idr);
          return {
            id: product.id, productId: product.id, name: product.name, app: product.name,
            category, description: product.description || "Informasi layanan digital PrimeHub.",
            price_idr: price, price: money(price), stock: product.stock,
            duration: product.stock > 0 ? "Stok tersedia" : "Stok habis",
            icon: style.icon, tone: style.tone, image_url: product.image_url,
            methodLabel: "Informasi paket", eta: "Mengikuti konfirmasi admin", featured: index === 0
          };
        });
        if (!cancelled) {
          setCatalogServices(mapped);
          setCatalogStatus("live");
          hasLoadedSuccessfully = true;
        }
      } catch {
        if (!cancelled && !hasLoadedSuccessfully) {
          setCatalogServices((current) => current.length > 0 ? current : fallbackCatalogServices);
          setCatalogStatus("error");
        }
      } finally {
        refreshInProgress = false;
      }
    }

    // Fetch on open, then keep an already-open shop synchronized with admin edits.
    void loadCatalog();
    const channel = client!
      .channel("primehub-storefront-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void loadCatalog();
      })
      .subscribe();
    const backupRefresh = window.setInterval(() => { void loadCatalog(); }, 15000);
    const onFocus = () => { void loadCatalog(); };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(backupRefresh);
      window.removeEventListener("focus", onFocus);
      void client!.removeChannel(channel);
    };
  }, []);

  const categoryOptions = useMemo(
    () => ["Semua", ...Array.from(new Set(catalogServices.map((service) => service.category).filter(Boolean)))],
    [catalogServices]
  );
  const filteredServices = useMemo(() => catalogServices.filter((service) => {
    const categoryMatch = activeCategory === "Semua" || service.category === activeCategory;
    const query = searchTerm.toLowerCase().trim();
    return categoryMatch && (!query || [service.name, service.app, service.description, service.category].some((value) => value.toLowerCase().includes(query)));
  }), [activeCategory, catalogServices, searchTerm]);

  function openService(service: Service, mode: "detail" | "order") {
    setSelectedService(service);
    setModalMode(mode);
    setSubmitted(false);
    setRequestSummary("");
    setRequestError("");
    setCreatedOrder(null);
    setCustomerName("");
    setCustomerContact("");
    setCustomerNote("");
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) return;
    setSubmitting(true);
    setRequestError("");
    try {
      if (selectedService.productId && supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: "POST",
          headers: { apikey: supabaseKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: customerName,
            customer_contact: customerContact,
            customer_note: customerNote,
            items: [{ product_id: selectedService.productId, quantity: 1 }]
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Pesanan belum dapat dibuat. Coba lagi nanti.");
        const order = result.order;
        const orderTotal = Number(order?.total_idr);
        if (!order?.order_code || !Number.isFinite(orderTotal) || orderTotal < 0) {
          throw new Error("Respons pesanan tidak lengkap. Hubungi admin untuk memeriksa kode pesanan.");
        }
        const summary = [
          "PrimeHub — ringkasan pesanan",
          "Layanan: " + selectedService.name,
          "Kode pesanan: " + order.order_code,
          "Total: " + money(orderTotal),
          "Status pembayaran: Menunggu verifikasi",
          "Nama: " + customerName,
          "Kontak: " + customerContact,
          customerNote ? "Catatan: " + customerNote : ""
        ].filter(Boolean).join("\n");
        setCreatedOrder({ order_code: order.order_code, total_idr: orderTotal });
        setRequestSummary(summary);
        setSubmitted(true);
        return;
      }
      setRequestSummary([
        "PrimeHub — ringkasan permintaan demo",
        "Layanan: " + selectedService.name,
        "Harga contoh: " + selectedService.price,
        "Nama: " + customerName,
        "Kontak: " + customerContact,
        customerNote ? "Catatan: " + customerNote : "",
        "",
        "Ini hanya demo lokal. Belum ada transaksi atau aktivasi nyata."
      ].filter(Boolean).join("\n"));
      setSubmitted(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Permintaan gagal diproses.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="primehub-app">
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="#home" aria-label="PrimeHub beranda">
            <Image src="/primehub/primehub-logo.svg" alt="PrimeHub" width={150} height={42} priority />
          </a>
          <nav className="nav-links" aria-label="Navigasi utama">
            <a href="#home">Beranda</a><a href="#layanan">Katalog Premium</a><a href="#cara-pesan">Cara Pesan</a><a href="#bantuan">Bantuan</a>
          </nav>
          <div className="header-actions"><a className="button button-primary" href="#layanan">Jelajahi <ArrowRight size={16} /></a></div>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> Premium Services. Better Life.</span>
            <h1>Upgrade ke Premium,<br /><span>Lebih Mudah.</span></h1>
            <p className="hero-description">Temukan pilihan langganan premium digital dengan informasi paket yang jelas dan proses aktivasi sesuai metode yang didukung tiap layanan.</p>
            <div className="hero-actions"><a className="button button-primary" href="#layanan">Jelajahi Premium <ArrowRight size={17} /></a><a className="button button-secondary" href="#cara-pesan">Cara Pesan</a></div>
            <div className="trust-row"><span>✓ Metode transparan</span><span>✓ Status jelas</span><span>✓ Tanpa password/OTP</span></div>
          </div>
          <div className="hero-preview">
            <div className="preview-head">
              <div><strong>Produk dari Admin</strong><small>{catalogStatus === "live" ? "Terhubung ke katalog toko" : catalogStatus === "loading" ? "Memuat katalog…" : catalogStatus === "error" ? "Koneksi katalog bermasalah" : "Katalog belum terhubung"}</small></div>
              {catalogStatus === "live" && <span className="live-tag">LIVE</span>}
            </div>
            {catalogServices.slice(0, 3).map((service) => <div className="preview-item" key={service.id}>
              <span className="preview-icon">{service.image_url ? <img src={service.image_url} alt="" loading="lazy" /> : service.icon}</span>
              <span className="preview-product-name"><b>{service.name}</b><small>{service.category} · {service.duration}</small></span>
              <strong className="preview-price">{service.price}</strong>
            </div>)}
            {catalogServices.length === 0 && <p className="preview-empty">{catalogStatus === "loading" ? "Mengambil produk yang diunggah dari panel admin…" : catalogStatus === "error" ? "Produk belum dapat dimuat. Coba buka ulang halaman." : "Belum ada produk aktif. Produk yang disimpan di panel admin akan muncul di sini."}</p>}
            <p className="preview-note">Daftar ini tersambung ke produk aktif di panel admin.</p>
          </div>
        </div>
      </section>

      <section className="catalog section-wrap" id="layanan">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">KATALOG PREMIUM</span><h2>Temukan paket yang cocok<span>.</span></h2><p>Cari aplikasi, pilih kategori, lalu lihat detail metode aktivasi setiap paket.</p></div><span className="catalog-count">{filteredServices.length.toString().padStart(2, "0")} PAKET</span></div>
          <div className="notice">
            {catalogStatus === "live" ? "Produk aktif berasal langsung dari panel admin. Tambah atau ubah produk di admin, lalu perubahan akan muncul otomatis di katalog." : catalogStatus === "loading" ? "Memuat produk yang tersimpan di panel admin…" : catalogStatus === "error" ? "Katalog belum bisa dimuat. Periksa koneksi Supabase." : "Katalog belum terhubung ke database. Produk contoh tidak ditampilkan."}
          </div>
          <div className="catalog-tools">
            <label className="search-box"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari aplikasi atau paket premium…" aria-label="Cari layanan" />{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Hapus pencarian"><X size={15} /></button>}</label>
            <div className="category-tabs" role="group" aria-label="Filter kategori">
              {categoryOptions.map((category) => <button type="button" key={category} className={activeCategory === category ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
          </div>
          <div className="service-grid">
            {filteredServices.map((service) => <article className="service-card" key={service.id}>
              <div className="service-card-top">{service.image_url ? <img src={service.image_url} alt={service.name} loading="lazy" /> : <span className={"service-icon " + service.tone}>{service.icon}</span>}</div>
              <span className="service-category">{service.category}</span><h3>{service.name}</h3><p>{service.description}</p>
              <div className="service-meta"><span>{service.duration}</span><span>{service.methodLabel}</span></div>
              <div className="service-card-bottom"><div><small>Harga</small><strong>{service.price}</strong></div><div className="card-buttons"><button className="button button-secondary button-small" type="button" onClick={() => openService(service, "detail")}>Detail</button><button className="button button-primary button-small" type="button" disabled={Boolean(service.productId && (service.stock ?? 0) <= 0)} onClick={() => openService(service, "order")}>Pesan</button></div></div>
            </article>)}
            {filteredServices.length === 0 && <div className="empty-state"><Search size={28} /><h3>{catalogStatus === "loading" ? "Memuat katalog…" : catalogStatus === "error" ? "Katalog belum bisa dimuat" : catalogStatus === "unconfigured" ? "Katalog belum terhubung" : searchTerm || activeCategory !== "Semua" ? "Paket tidak ditemukan" : "Belum ada produk aktif"}</h3><p>{catalogStatus === "error" ? "Koneksi katalog sedang bermasalah. Coba lagi nanti." : catalogStatus === "unconfigured" ? "Hubungkan Supabase agar produk yang disimpan di admin muncul di toko." : catalogStatus === "live" && !searchTerm && activeCategory === "Semua" ? "Tambahkan dan aktifkan produk di panel admin; produk akan muncul otomatis di sini." : "Coba kata kunci atau kategori lain."}</p>{(searchTerm || activeCategory !== "Semua") && <button className="button button-secondary" type="button" onClick={() => { setSearchTerm(""); setActiveCategory("Semua"); }}>Reset pencarian</button>}</div>}
          </div>
          <p className="catalog-note"><CircleHelp size={15} /> Katalog hanya menampilkan produk aktif dari panel admin, termasuk foto, harga, stok, dan deskripsi yang tersimpan.</p>
        </div>
      </section>

      <section className="features-section" id="keunggulan"><div className="container">
        <div className="section-heading"><div><span className="eyebrow">KENAPA PRIMEHUB?</span><h2>Lebih jelas dari awal<span>.</span></h2></div></div>
        <div className="features-grid">
          <article className="feature-card"><ShieldCheck /><h3>Metode sesuai paket</h3><p>Metode aktivasi diatur per paket, bukan disamakan untuk semua aplikasi.</p></article>
          <article className="feature-card"><CheckCircle2 /><h3>Privasi pelanggan</h3><p>Jangan pernah membagikan password, OTP, atau kode pemulihan akun.</p></article>
          <article className="feature-card"><Clock3 /><h3>Status terpisah</h3><p>Status pembayaran dan aktivasi dicatat secara terpisah saat layanan tersedia.</p></article>
        </div>
      </div></section>

      <section className="steps-section" id="cara-pesan"><div className="container">
        <div className="section-heading"><div><span className="eyebrow">CARA PESAN</span><h2>Empat langkah sederhana<span>.</span></h2><p>Alur yang jelas dari memilih paket sampai memeriksa ringkasan.</p></div></div>
        <div className="steps-grid">
          <article className="step-card"><span>01</span><h3>Pilih paket</h3><p>Baca durasi, harga contoh, dan metode aktivasi.</p></article>
          <article className="step-card"><span>02</span><h3>Isi formulir</h3><p>Masukkan informasi kontak yang diperlukan saja.</p></article>
          <article className="step-card"><span>03</span><h3>Konfirmasi</h3><p>Periksa ringkasan sebelum membuat permintaan atau pesanan.</p></article>
          <article className="step-card"><span>04</span><h3>Pantau status</h3><p>Untuk pesanan nyata, tunggu verifikasi admin. Demo tidak melakukan pembayaran.</p></article>
        </div>
      </div></section>

      <section className="help-section" id="bantuan"><div className="container">
        <div className="section-heading"><div><span className="eyebrow">BANTUAN</span><h2>Pertanyaan umum<span>.</span></h2></div></div>
        <div className="faq-grid">
          <details><summary>Bagaimana cara membayar?</summary><p>Setelah pesanan dicatat, tunggu konfirmasi admin melalui kontak yang kamu berikan. Jangan mengirim bukti transfer ke pihak yang tidak terverifikasi. Pesanan belum lunas sampai pembayaran diperiksa admin.</p></details>
          <details><summary>Apakah semua paket memakai undangan tim?</summary><p>Tidak. Metode aktivasi harus sesuai dukungan dan ketentuan resmi setiap penyedia.</p></details>
          <details><summary>Apakah saya perlu memberi password atau OTP?</summary><p>Tidak. Jangan pernah memasukkan password, OTP, atau kode pemulihan.</p></details>
          <details><summary>Bagaimana jika produk bermasalah?</summary><p>Hubungi PrimeHub dengan kode pesanan. Jika produk tidak diserahkan, tidak sesuai deskripsi, atau akses tidak dapat dipulihkan/diganti selama masa yang dijanjikan, kamu dapat mengajukan penggantian atau pengembalian dana sesuai kebijakan.</p></details>
        </div>
        <div className="notice final-notice">Pesanan baru berstatus menunggu verifikasi sampai admin mengonfirmasi pembayaran dan pemenuhan pesanan. Baca Syarat Layanan dan Kebijakan Pengembalian Dana sebelum melanjutkan.</div>
      </div></section>

      <footer className="site-footer"><div className="container">
        <div className="footer-top"><a className="footer-brand" href="#home"><Image src="/primehub/primehub-logo.svg" alt="PrimeHub" width={140} height={40} /></a><p>Premium Services. Better Life.</p><a className="footer-link" href="#layanan">Kembali ke katalog <ArrowRight size={15} /></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} PrimeHub.</span><span>Informasi produk pihak ketiga perlu dibaca sebelum memesan.</span><span className="footer-legal-links"><a href="/primehub/syarat-ketentuan/">Syarat Layanan</a><a href="/primehub/kebijakan-privasi/">Kebijakan Privasi</a><a href="/primehub/pengembalian-dana/">Pengembalian Dana</a></span></div>
      </div></footer>

      {selectedService && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedService(null); }}>
        <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <button className="modal-close" type="button" aria-label="Tutup" onClick={() => setSelectedService(null)}><X size={20} /></button>
          {!submitted && modalMode === "detail" ? <div className="service-detail">
            <span className={"service-icon modal-service-icon " + selectedService.tone}>{selectedService.icon}</span><span className="eyebrow">DETAIL PAKET</span><h2 id="order-title">{selectedService.name}</h2><p>{selectedService.description}</p>
            <div className="detail-list"><div><span>Durasi</span><strong>{selectedService.duration}</strong></div><div><span>Metode</span><strong>{selectedService.methodLabel}</strong></div><div><span>Harga contoh</span><strong>{selectedService.price}</strong></div><div><span>Estimasi</span><strong>{selectedService.eta}</strong></div></div>
            <p className="modal-note">Informasi pada mode demo adalah contoh, bukan jaminan ketersediaan layanan.</p><button className="button button-primary form-submit" type="button" onClick={() => setModalMode("order")}>Lanjut ke formulir <ArrowRight size={17} /></button>
          </div> : !submitted ? <>
            <span className={"service-icon modal-service-icon " + selectedService.tone}>{selectedService.icon}</span><span className="eyebrow">FORMULIR PERMINTAAN</span><h2 id="order-title">Tertarik dengan {selectedService.name}?</h2>
            <p>{selectedService.productId ? "Pesanan dicatat dengan status menunggu verifikasi. Admin perlu mengonfirmasi ketersediaan dan memberikan instruksi pembayaran/aktivasi. Jangan kirim password, OTP, PIN, atau kode pemulihan." : "Isi formulir untuk melihat ringkasan demo. Data belum dikirim ke backend."}</p>
            <form onSubmit={submitInquiry} className="inquiry-form">
              <label>Nama<input required maxLength={90} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama kamu" /></label>
              <label>Email atau WhatsApp<input required maxLength={150} value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} placeholder="Kontak yang bisa dihubungi" /></label>
              <label>Catatan (opsional)<textarea maxLength={300} value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Pertanyaan atau paket yang ingin dikonfirmasi" rows={3} /></label>
              <label className="policy-consent"><input type="checkbox" required /> <span>Saya telah membaca <a href="/primehub/syarat-ketentuan/" target="_blank" rel="noreferrer">Syarat Layanan</a>, <a href="/primehub/kebijakan-privasi/" target="_blank" rel="noreferrer">Kebijakan Privasi</a>, dan <a href="/primehub/pengembalian-dana/" target="_blank" rel="noreferrer">Kebijakan Pengembalian Dana</a>.</span></label>
              {requestError && <p className="form-error" role="alert">{requestError}</p>}<button type="submit" className="button button-primary form-submit" disabled={submitting}>{submitting ? "Memproses…" : selectedService.productId ? "Buat pesanan" : "Buat ringkasan demo"} <ArrowRight size={17} /></button>
            </form>
          </> : <div className="request-summary">
            <span className="success-mark"><CheckCircle2 size={28} /></span><span className="eyebrow">RINGKASAN</span><h2 id="order-title">{createdOrder ? "Pesanan tercatat" : "Ringkasan siap disalin"}</h2>
            <p>{createdOrder ? "Status pesanan menunggu verifikasi admin. Simpan kode ini dan jangan menganggap pesanan lunas sebelum pembayaran diverifikasi." : "Ini ringkasan demo lokal. Tidak ada pembayaran atau aktivasi nyata."}</p>
            {createdOrder && <p className="order-code"><strong>Kode pesanan: {createdOrder.order_code}</strong><br />Total: {money(createdOrder.total_idr)}<br />Pembayaran: Menunggu verifikasi admin</p>}
            <textarea readOnly value={requestSummary} rows={7} aria-label="Ringkasan permintaan" />
            <button className="button button-primary form-submit" type="button" onClick={() => { void navigator.clipboard?.writeText(requestSummary); }}>Salin ringkasan <CheckCircle2 size={17} /></button>
            <button className="button button-secondary form-submit" type="button" onClick={() => setSelectedService(null)}>Selesai</button>
          </div>}
        </section>
      </div>}
      <a className="back-to-top" href="#home" aria-label="Kembali ke atas"><ChevronDown size={18} /></a>
    </main>
  );
}
