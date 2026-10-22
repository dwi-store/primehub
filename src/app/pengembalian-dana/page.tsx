import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengembalian Dana — PrimeHub",
  description: "Aturan penanganan pesanan dan pengembalian dana PrimeHub."
};

export default function RefundPage() {
  return (
    <main className="primehub-app legal-shell">
      <header className="site-header"><div className="container nav"><a className="legal-brand" href="/primehub/">PrimeHub</a><a className="button button-secondary button-small" href="/primehub/">Kembali ke toko</a></div></header>
      <article className="legal-document container">
        <span className="eyebrow">BANTUAN PESANAN</span>
        <h1>Kebijakan Pengembalian Dana</h1>
        <p className="legal-updated">Terakhir diperbarui: 22 Oktober 2026</p>
        <p>Jika pesanan tidak berjalan sesuai yang dijelaskan, hubungi PrimeHub supaya masalah bisa diperiksa dan diselesaikan.</p>
        <h2>Alasan pengajuan</h2>
        <ul>
          <li>Pembayaran berhasil tetapi produk tidak diserahkan.</li>
          <li>Akses yang diterima tidak sesuai dengan deskripsi pesanan.</li>
          <li>Akses gagal digunakan atau berhenti selama masa yang dijanjikan dan tidak dapat dipulihkan atau diganti.</li>
          <li>Pembayaran ganda atau pesanan dibatalkan oleh PrimeHub.</li>
        </ul>
        <h2>Proses</h2>
        <ol>
          <li>Hubungi kanal dukungan resmi yang diberikan pada konfirmasi pesanan.</li>
          <li>Sertakan kode pesanan, bukti pembayaran yang relevan, dan penjelasan singkat.</li>
          <li>Admin memeriksa pesanan dan menyampaikan keputusan serta langkah berikutnya.</li>
        </ol>
        <p>Jika pesanan tidak dapat dipenuhi, PrimeHub akan menawarkan penggantian yang sesuai atau pengembalian dana berdasarkan kondisi pesanan dan hukum yang berlaku. Setelah refund disetujui, PrimeHub menargetkan memulai proses dalam 7 hari kerja. Waktu dana diterima dapat berbeda menurut penyedia pembayaran.</p>
        <p>Jangan pernah mengirim kata sandi, PIN, OTP, kode pemulihan, atau nomor kartu penuh saat meminta bantuan.</p>
        <p className="legal-owner-note"><strong>Catatan pengelola:</strong> pastikan kanal dukungan dan alur pengembalian dana sudah benar-benar aktif sebelum menerima pembayaran publik.</p>
        <a className="button button-primary" href="/primehub/">Kembali ke PrimeHub</a>
      </article>
      <footer className="site-footer"><div className="container footer-bottom"><span>© 2026 PrimeHub</span><a href="/primehub/">Beranda</a><a href="/primehub/syarat-ketentuan/">Syarat Layanan</a><a href="/primehub/kebijakan-privasi/">Kebijakan Privasi</a></div></footer>
    </main>
  );
}
