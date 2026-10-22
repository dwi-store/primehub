export const metadata = { title: "Kebijakan Privasi — UPPRIME" };

export default function PrivacyPage() {
  return <main className="primehub-app legal-shell">
    <header className="site-header"><div className="container nav"><a className="legal-brand" href="/upprime/">UPPRIME</a><a className="button button-secondary button-small" href="/upprime/">Kembali ke toko</a></div></header>
    <article className="legal-document container">
      <h1>Kebijakan Privasi</h1>
      <p className="legal-updated">Terakhir diperbarui: 22 Oktober 2026</p>
      <h2>Informasi yang digunakan</h2>
      <p>Untuk memproses pesanan, UPPRIME menggunakan nama, kontak, detail pesanan, status transaksi, dan informasi teknis yang diperlukan untuk keamanan layanan.</p>
      <h2>Penggunaan informasi</h2>
      <p>Informasi digunakan untuk mengelola pesanan, konfirmasi pembayaran, penyerahan produk, dukungan pelanggan, mencegah penyalahgunaan, serta memenuhi kewajiban hukum.</p>
      <h2>Penyedia layanan</h2>
      <p>UPPRIME menggunakan Supabase untuk backend dan penyimpanan pesanan serta layanan hosting. Jika notifikasi admin diaktifkan, informasi pesanan yang diperlukan dapat diteruskan ke layanan tersebut.</p>
      <h2>Penyimpanan dan permintaan</h2>
      <p>Informasi disimpan selama diperlukan untuk menjalankan pesanan, menangani keluhan, menjaga keamanan, dan memenuhi kewajiban hukum. Untuk meminta akses atau koreksi informasi terkait pesanan, gunakan kanal komunikasi yang digunakan untuk pesanan tersebut dan sertakan kode pesanan. Permintaan akan diperiksa secara wajar dengan tetap memperhatikan kewajiban penyimpanan yang berlaku.</p>
      <p>Jangan mengirim kata sandi, PIN, OTP, atau kode pemulihan kepada UPPRIME. Kebijakan ini dapat diperbarui apabila layanan berubah.</p>
      
    </article>
    <footer className="site-footer"><div className="container footer-bottom"><span>© 2026 UPPRIME</span><a href="/upprime/">Beranda</a><a href="/upprime/syarat-ketentuan/">Syarat Layanan</a><a href="/upprime/pengembalian-dana/">Pengembalian Dana</a></div></footer>
  </main>;
}
