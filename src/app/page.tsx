"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  category: "Produktivitas" | "Hiburan" | "Kreativitas" | "AI";
  description: string;
  price: string;
  duration: string;
  icon: string;
  tone: string;
  featured?: boolean;
};

const services: Service[] = [
  { id: "chatgpt", name: "AI Assistant", category: "AI", description: "Bantu ide, belajar, dan produktivitas dengan AI.", price: "Hubungi kami", duration: "Paket tersedia", icon: "✳", tone: "mint", featured: true },
  { id: "design", name: "Design Suite", category: "Kreativitas", description: "Perangkat desain untuk konten yang lebih menonjol.", price: "Hubungi kami", duration: "Paket tersedia", icon: "✿", tone: "pink" },
  { id: "music", name: "Music Premium", category: "Hiburan", description: "Nikmati pengalaman mendengarkan musik yang nyaman.", price: "Hubungi kami", duration: "Paket tersedia", icon: "♫", tone: "green" },
  { id: "video", name: "Video Premium", category: "Hiburan", description: "Temani waktu santai dengan pengalaman video premium.", price: "Hubungi kami", duration: "Paket tersedia", icon: "▶", tone: "red" },
  { id: "cloud", name: "Cloud Storage", category: "Produktivitas", description: "Simpan dan kelola file penting dengan lebih praktis.", price: "Hubungi kami", duration: "Paket tersedia", icon: "☁", tone: "blue" },
  { id: "learning", name: "Learning Plus", category: "Produktivitas", description: "Dukung perjalanan belajar dan pengembangan diri.", price: "Hubungi kami", duration: "Paket tersedia", icon: "✦", tone: "yellow" }
];

const categories = ["Semua layanan", "AI", "Kreativitas", "Hiburan", "Produktivitas"] as const;

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Semua layanan");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredServices = useMemo(() => services.filter((service) => {
    const categoryMatch = activeCategory === "Semua layanan" || service.category === activeCategory;
    const query = searchTerm.toLowerCase().trim();
    const searchMatch = !query || service.name.toLowerCase().includes(query) || service.description.toLowerCase().includes(query) || service.category.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  }), [activeCategory, searchTerm]);

  function openOrder(service: Service) {
    setSelectedService(service);
    setSubmitted(false);
  }

  function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) return;
    const message = [
      "Halo PrimeHub, saya ingin bertanya tentang layanan.",
      "Layanan: " + selectedService.name,
      "Nama: " + customerName,
      "Kontak: " + customerContact,
      customerNote ? "Catatan: " + customerNote : ""
    ].filter(Boolean).join("\n");
    setCustomerNote(message);
    setSubmitted(true);
  }

  return (
    <main>
      <div className="announcement"><Sparkles size={14} /> Pilihan layanan digital untuk hari yang lebih produktif <ArrowRight size={14} /></div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="PrimeHub beranda">
          <Image src="/primehub-logo.svg" alt="PrimeHub" width={168} height={48} priority />
        </a>
        <nav className={mobileMenuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Navigasi utama">
          <a href="#layanan" onClick={() => setMobileMenuOpen(false)}>Jelajahi layanan</a>
          <a href="#keunggulan" onClick={() => setMobileMenuOpen(false)}>Kenapa PrimeHub?</a>
          <a href="#bantuan" onClick={() => setMobileMenuOpen(false)}>Bantuan</a>
        </nav>
        <div className="header-actions">
          <a className="text-link" href="#layanan">Lihat katalog <ArrowDownRight size={16} /></a>
          <button className="mobile-menu" aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DIGITAL UPGRADE</div>
          <h1>Lebih banyak yang bisa kamu lakukan<span>.</span></h1>
          <p className="hero-description">Layanan digital premium yang membantumu berkarya, menikmati hiburan, dan menjalani hari dengan lebih mudah.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#layanan">Jelajahi layanan <ArrowRight size={17} /></a>
            <a className="button button-secondary" href="#keunggulan">Kenali PrimeHub</a>
          </div>
          <div className="trust-row">
            <div className="trust-avatars"><span>✦</span><span>✳</span><span>◈</span></div>
            <div><strong>Praktis, jelas, nyaman.</strong><small>Pengalaman layanan yang lebih simpel</small></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Ilustrasi layanan digital PrimeHub">
          <div className="art-glow" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="floating-card floating-card-top"><span className="mini-icon mint">✳</span><span><b>Work smarter</b><small>Ruang untuk ide baru</small></span><Check size={17} className="check-icon" /></div>
          <div className="hub-card">
            <div className="hub-logo-mark"><Image src="/favicon.svg" alt="" width={70} height={70} /></div>
            <span className="hub-overline">YOUR PREMIUM HUB</span>
            <h2>Make room<br />for more.</h2>
            <div className="hub-card-bottom"><span>PRIMEHUB</span><Sparkles size={17} /></div>
          </div>
          <div className="floating-card floating-card-bottom"><span className="mini-icon violet"><Zap size={19} /></span><span><b>Simple by design</b><small>Pilih layananmu, mulai langkahmu</small></span></div>
          <div className="spark spark-one">✳</div><div className="spark spark-two">✦</div><div className="spark spark-three">·</div>
        </div>
        <div className="hero-bottom-label"><span>01 / DISCOVER</span><span>TOOLS FOR YOUR EVERYDAY</span></div>
      </section>

      <section className="benefit-strip" id="keunggulan">
        <div className="benefit"><span className="benefit-icon"><ShieldCheck size={19} /></span><div><b>Transparan</b><small>Informasi layanan yang jelas</small></div></div>
        <div className="benefit"><span className="benefit-icon"><Zap size={19} /></span><div><b>Praktis</b><small>Alur pemesanan sederhana</small></div></div>
        <div className="benefit"><span className="benefit-icon"><Headphones size={19} /></span><div><b>Siap membantu</b><small>Dukungan saat kamu butuh</small></div></div>
        <div className="benefit"><span className="benefit-icon"><Clock3 size={19} /></span><div><b>Hemat waktu</b><small>Semua pilihan dalam satu tempat</small></div></div>
      </section>

      <section className="catalog section-wrap" id="layanan">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> THE PRIME COLLECTION</div><h2>Temukan yang kamu butuhkan<span>.</span></h2><p>Kurasi layanan digital untuk mendukung setiap sisi keseharianmu.</p></div>
          <div className="catalog-count"><strong>{filteredServices.length.toString().padStart(2, "0")}</strong><span>LAYANAN</span></div>
        </div>
        <div className="catalog-tools">
          <div className="category-tabs" role="group" aria-label="Filter kategori">
            {categories.map((category) => <button key={category} className={activeCategory === category ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(category)}>{category}</button>)}
          </div>
          <label className="search-box"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari layanan..." aria-label="Cari layanan" />{searchTerm && <button onClick={() => setSearchTerm("")} aria-label="Hapus pencarian"><X size={15} /></button>}</label>
        </div>
        <div className="service-grid">
          {filteredServices.map((service, index) => <article className="service-card" key={service.id}>
            <div className="service-card-top"><span className={"service-icon " + service.tone}>{service.icon}</span><span className="service-number">0{index + 1}</span></div>
            {service.featured && <span className="popular-label"><Sparkles size={12} /> PILIHAN POPULER</span>}
            <span className="service-category">{service.category}</span>
            <h3>{service.name}</h3><p>{service.description}</p>
            <div className="service-card-bottom"><div><strong>{service.price}</strong><small>{service.duration}</small></div><button className="round-arrow" aria-label={"Tanya tentang " + service.name} onClick={() => openOrder(service)}><ArrowRight size={18} /></button></div>
          </article>)}
          {filteredServices.length === 0 && <div className="empty-state"><Search size={26} /><h3>Layanan belum ditemukan</h3><p>Coba kata kunci atau kategori lainnya.</p><button className="button button-secondary" onClick={() => { setSearchTerm(""); setActiveCategory("Semua layanan"); }}>Reset pencarian</button></div>}
        </div>
        <p className="catalog-note"><CircleHelp size={15} /> Ketersediaan, harga, dan ketentuan tiap layanan akan dikonfirmasi sebelum pemesanan.</p>
      </section>

      <section className="closing-cta">
        <div className="cta-orb cta-orb-one" /><div className="cta-orb cta-orb-two" />
        <div className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</div>
        <h2>Siap upgrade rutinitasmu<span>?</span></h2>
        <p>Jelajahi pilihan layanan dan temukan yang paling sesuai untukmu.</p>
        <a className="button button-light" href="#layanan">Mulai jelajahi <ArrowRight size={17} /></a>
      </section>

      <footer className="site-footer" id="bantuan">
        <div className="footer-top"><a className="brand footer-brand" href="#"><Image src="/primehub-logo-dark.png" alt="PrimeHub" width={168} height={48} /></a><p>Premium Services. Better Life.</p><a href="#layanan" className="footer-link">Jelajahi katalog <ArrowRight size={15} /></a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} PrimeHub. All rights reserved.</span><span>Layanan harus digunakan sesuai ketentuan resmi penyedia masing-masing.</span></div>
      </footer>

      {selectedService && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedService(null); }}>
        <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <button className="modal-close" aria-label="Tutup" onClick={() => setSelectedService(null)}><X size={20} /></button>
          {!submitted ? <>
            <div className={"service-icon modal-service-icon " + selectedService.tone}>{selectedService.icon}</div>
            <div className="eyebrow"><span className="eyebrow-dot" /> REQUEST INFORMATION</div>
            <h2 id="order-title">Tertarik dengan {selectedService.name}?</h2>
            <p>Isi detail berikut. Ini menyiapkan ringkasan permintaan saja; belum ada pembayaran atau pesanan yang dikirim.</p>
            <form onSubmit={submitInquiry} className="inquiry-form">
              <label>Nama<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama kamu" /></label>
              <label>Kontak yang bisa dihubungi<input required value={customerContact} onChange={(event) => setCustomerContact(event.target.value)} placeholder="Email atau nomor WhatsApp" /></label>
              <label>Catatan (opsional)<textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Paket atau pertanyaan yang ingin dikonfirmasi" rows={3} /></label>
              <button type="submit" className="button button-primary form-submit">Buat ringkasan permintaan <ArrowRight size={17} /></button>
            </form>
          </> : <div className="request-summary">
            <span className="success-mark"><Check size={28} /></span><div className="eyebrow">REQUEST SUMMARY</div><h2 id="order-title">Ringkasan siap disalin</h2><p>Permintaan belum dikirim. Salin ringkasan ini lalu hubungi kanal resmi PrimeHub setelah kontak layanan ditambahkan.</p>
            <textarea readOnly value={customerNote} rows={7} aria-label="Ringkasan permintaan" />
            <button className="button button-primary form-submit" onClick={() => navigator.clipboard?.writeText(customerNote)}>Salin ringkasan <Check size={17} /></button>
            <button className="button button-secondary form-submit" onClick={() => setSelectedService(null)}>Selesai</button>
          </div>}
        </section>
      </div>}
      <a className="back-to-top" href="#" aria-label="Kembali ke atas"><ChevronDown size={18} /></a>
    </main>
  );
}