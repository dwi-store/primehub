"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap
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

const demoServices: Service[] = [
  { id: "design", name: "Design Plus", app: "Design Suite", category: "Desain", description: "Fitur desain dan aset premium untuk kebutuhan kreatif.", price: "Rp29.000", price_idr: 29000, duration: "1 bulan", icon: "🎨", methodLabel: "Undangan tim", eta: "Estimasi contoh: 1–24 jam", tone: "violet", featured: true },
  { id: "music", name: "Music Premium", app: "Music", category: "Musik", description: "Pengalaman musik dengan fitur premium.", price: "Rp19.000", price_idr: 19000, duration: "1 bulan", icon: "🎵", methodLabel: "Voucher/kode", eta: "Setelah kode tersedia (contoh)", tone: "green" },
  { id: "cloud", name: "Cloud Extra", app: "Cloud Storage", category: "Cloud", description: "Tambahan kapasitas untuk file dan dokumen.", price: "Rp25.000", price_idr: 25000, duration: "1 bulan", icon: "☁️", methodLabel: "Email akun", eta: "Estimasi contoh: 1–24 jam", tone: "blue" },
  { id: "work", name: "Work Pro", app: "Productivity Suite", category: "Produktivitas", description: "Fitur produktivitas dan kolaborasi.", price: "Rp39.000", price_idr: 39000, duration: "1 bulan", icon: "🗂️", methodLabel: "Undangan tim", eta: "Estimasi contoh: 1–24 jam", tone: "orange" },
  { id: "learn", name: "Learn Plus", app: "Learning Platform", category: "Belajar", description: "Paket belajar premium untuk mendukung proses belajar.", price: "Rp49.000", price_idr: 49000, duration: "3 bulan", icon: "📚", methodLabel: "Metode resmi lain", eta: "Mengikuti instruksi (contoh)", tone: "yellow" },
  { id: "edit", name: "Edit Studio", app: "Video Editor", category: "Editing", description: "Fitur tambahan untuk kebutuhan editing video.", price: "Rp32.000", price_idr: 32000, duration: "1 bulan", icon: "🎬", methodLabel: "Voucher/kode", eta: "Setelah kode tersedia (contoh)", tone: "pink" },
  { id: "ai", name: "AI Assist", app: "AI Tools", category: "AI", description: "Paket fitur AI tambahan sesuai ketentuan penyedia.", price: "Rp59.000", price_idr: 59000, duration: "1 bulan", icon: "✦", methodLabel: "Email akun", eta: "Estimasi contoh: 1–24 jam", tone: "violet" },
  { id: "design-year", name: "Design Plus Tahunan", app: "Design Suite", category: "Desain", description: "Contoh paket tahunan untuk kebutuhan desain.", price: "Rp249.000", price_idr: 249000, duration: "12 bulan", icon: "🖌️", methodLabel: "Undangan tim", eta: "Estimasi contoh: 1–24 jam", tone: "violet" },
  { id: "cloud-year", name: "Cloud Extra Tahunan", app: "Cloud Storage", category: "Cloud", description: "Contoh paket cloud jangka panjang.", price: "Rp249.000", price_idr: 249000, duration: "12 bulan", icon: "🗃️", methodLabel: "Voucher/kode", eta: "Setelah kode tersedia (contoh)", tone: "blue" },
  { id: "music-year", name: "Music Premium Tahunan", app: "Music", category: "Musik", description: "Contoh paket musik jangka panjang.", price: "Rp199.000", price_idr: 199000, duration: "12 bulan", icon: "🎧", methodLabel: "Voucher/kode", eta: "Setelah kode tersedia (contoh)", tone: "green" }
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

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
  const [catalogServices, setCatalogServices] = useState<Service[]>(supabaseUrl && supabaseKey ? [] : demoServices);
  const [catalogStatus, setCatalogStatus] = useState<"demo" | "loading" | "live" | "error">(supabaseUrl && supabaseKey ? "loading" : "demo");

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    let cancelled = false;
    async function loadCatalog() {
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/products?select=id,name,description,category,image_url,price_idr,stock,is_active&is_active=eq.true&order=created_at.desc`,
          { headers: { apikey: supabaseKey!, Accept: "application/json" } }
        );
        if (!response.ok) throw new Error("Katalog tidak dapat dimuat.");
        const rows = await response.json() as Array<{
          id: string; name: string; description: string | null; category: string | null;
          price_idr: number | string; stock: number; is_active: boolean; image_url: string | null;
        }>;
        if (!Array.isArray(rows)) throw new Error("Format katalog tidak valid.");
        const mapped: Service[] = rows.map((product, index) => {
          const category = product.category?.trim() || "Lainnya";
          const categoryLower = category.toLowerCase();
          const style = categoryLower.includes("ai") ? { icon: "✦", tone: "violet" }
            : categoryLower.includes("musik") || categoryLower.includes("music") || categoryLower.includes("hiburan") ? { icon: "🎵", tone: "green" }
            : categoryLower.includes("desain") || categoryLower.includes("kreat") ? { icon: "🎨", tone: "pink" }
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
        if (!cancelled) { setCatalogServices(mapped); setCatalogStatus("live"); }
      } catch {
        if (!cancelled) { setCatalogServices([]); setCatalogStatus("error"); }
      }
    }
    void loadCatalog();
    return () => { cancelled = true; };
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
            <div className="preview-head"><div><strong>Pilihan Premium</strong><small>Pratinjau katalog</small></div><span className="demo-tag">DEMO</span></div>
            <div className="preview-item"><span className="preview-icon">🎨</span><span><b>Design Plus</b><small>Desain kreatif</small></span><strong className="preview-price">Rp29 rb</strong></div>
            <div className="preview-item"><span className="preview-icon">🎵</span><span><b>Music Premium</b><small>Musik &amp; audio</small></span><strong className="preview-price">Rp19 rb</strong></div>
            <div className="preview-item"><span className="preview-icon">☁️</span><span><b>Cloud Extra</b><small>Penyimpanan cloud</small></span><strong className="preview-price">Rp25 rb</strong></div>
            <p className="preview-note">Harga pada pratinjau hanya contoh.</p>
          </div>
        </div>
      </section>

      <section className="catalog section-wrap" id="layanan">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">KATALOG PREMIUM</span><h2>Temukan paket yang cocok<span>.</span></h2><p>Cari aplikasi, pilih kategori, lalu lihat detail metode aktivasi setiap paket.</p></div><span className="catalog-count">{filteredServices.length.toString().padStart(2, "0")} PAKET</span></div>
          <div className={catalogStatus === "demo" ? "notice demo-notice" : "notice"}>
            {catalogStatus === "live" ? "Katalog dimuat dari backend. Periksa detail paket sebelum membuat pesanan." : catalogStatus === "loading" ? "Memuat katalog PrimeHub…" : catalogStatus === "error" ? "Katalog backend belum bisa dimuat. Periksa konfigurasi Supabase." : "Mode demo: harga dan paket adalah contoh. Pembayaran dan aktivasi nyata belum tersedia."}
          </div>
          <div className="catalog-tools">
            <label className="search-box"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari aplikasi atau paket premium…" aria-label="Cari layanan" />{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Hapus pencarian"><X size={15} /></button>}</label>
            <div className="category-tabs" role="group" aria-label="Filter kategori">
              {categoryOptions.map((category) => <button type="button" key={category} className={activeCategory === category ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
          </div>
          <div className="service-grid">
            {filteredServices.map((service) => <article className="service-card" key={service.id}>
              <div className="service-card-top">{service.image_url ? <img src={service.image_url} alt={service.name} loading="lazy" /> : <span className={"service-icon " + service.tone}>{service.icon}</span>}<span className="demo-tag">DEMO</span></div>
              <span className="service-category">{service.category}</span><h3>{service.name}</h3><p>{service.description}</p>
              <div className="service-meta"><span>{service.duration}</span><span>{service.methodLabel}</span></div>
              <div className="service-card-bottom"><div><small>{catalogStatus === "live" ? "Harga" : "Harga contoh"}</small><strong>{service.price}</strong></div><div className="card-buttons"><button className="button button-secondary button-small" type="button" onClick={() => openService(service, "detail")}>Detail</button><button className="button button-primary button-small" type="button" disabled={Boolean(service.productId && (service.stock ?? 0) <= 0)} onClick={() => openService(service, "order")}>Pesan</button></div></div>
            </article>)}
            {filteredServices.length === 0 && <div className="empty-state"><Search size={28} /><h3>{catalogStatus === "loading" ? "Memuat katalog…" : catalogStatus === "error" ? "Katalog belum bisa dimuat" : "Paket tidak ditemukan"}</h3><p>{catalogStatus === "error" ? "Koneksi katalog sedang bermasalah. Coba lagi nanti." : "Coba kata kunci atau kategori lain."}</p><button className="button button-secondary" type="button" onClick={() => { setSearchTerm(""); setActiveCategory("Semua"); }}>Reset pencarian</button></div>}
          </div>
          <p className="catalog-note"><CircleHelp size={15} /> Data dan harga demo hanya untuk pengujian tampilan; pastikan paket dan harga aktual dikonfirmasi sebelum transaksi.</p>
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
          <details><summary>Apakah pembayaran sudah aktif?</summary><p>Pembayaran nyata belum diaktifkan oleh halaman demo ini. Status lunas hanya boleh ditetapkan setelah verifikasi.</p></details>
          <details><summary>Apakah semua paket memakai undangan tim?</summary><p>Tidak. Metode aktivasi harus sesuai dukungan dan ketentuan resmi setiap penyedia.</p></details>
          <details><summary>Apakah saya perlu memberi password atau OTP?</summary><p>Tidak. Jangan pernah memasukkan password, OTP, atau kode pemulihan.</p></details>
          <details><summary>Apakah harga di katalog berlaku?</summary><p>Harga demo hanya contoh. Harga aktual harus dikonfirmasi sebelum transaksi.</p></details>
        </div>
        <div className="notice final-notice">Sebelum digunakan untuk pelanggan sungguhan, pastikan keamanan backend, kebijakan privasi, syarat layanan, dukungan pelanggan, dan pembayaran resmi sudah siap.</div>
      </div></section>

      <footer className="site-footer"><div className="container">
        <div className="footer-top"><a className="footer-brand" href="#home"><Image src="/primehub/primehub-logo.svg" alt="PrimeHub" width={140} height={40} /></a><p>Premium Services. Better Life.</p><a className="footer-link" href="#layanan">Kembali ke katalog <ArrowRight size={15} /></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} PrimeHub.</span><span>Prototype demo — bukan toko aktif atau klaim kemitraan resmi.</span></div>
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
            <p>{selectedService.productId ? "Pesanan akan berstatus menunggu verifikasi admin. Pembayaran tidak otomatis dianggap lunas." : "Isi formulir untuk melihat ringkasan demo. Data belum dikirim ke backend."}</p>
            <form onSubmit={submitInquiry} className="inquiry-form">
              <label>Nama<input required maxLength={90} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama kamu" /></label>
              <label>Email atau WhatsApp<input required maxLength={150} value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} placeholder="Kontak yang bisa dihubungi" /></label>
              <label>Catatan (opsional)<textarea maxLength={300} value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Pertanyaan atau paket yang ingin dikonfirmasi" rows={3} /></label>
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
