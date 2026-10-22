import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat Layanan — PrimeHub",
  description: "Syarat pemesanan, pembayaran, penyerahan produk, dan dukungan pelanggan PrimeHub."
};

export default function TermsPage() {
  return (
    <main className="primehub-app legal-shell">
      <header className="site-header"><div className="container nav"><a className="legal-brand" href="/primehub/">PrimeHub</a><a className="button button-secondary button-small" href="/primehub/">Kembali ke toko</a></div></header>
      <article className="legal-document container">
        <span className="eyebrow">INFORMASI PELANGGAN</span>
        <h1>Syarat Layanan PrimeHub</h1>
        <p className="legal-updated">Terakhir diperbarui: 22 Oktober 2026</p>
        <h2>1. Informasi produk dan harga</h2>
        <p>Deskripsi, harga, durasi, ketersediaan, dan metode aktivasi harus dikonfirmasi sebelum pelanggan membayar. Pesanan dapat berstatus menunggu verifikasi; status tersebut bukan bukti bahwa pembayaran telah diterima atau produk telah diserahkan. Jika informasi berubah sebelum pembayaran, pelanggan dapat membatalkan tanpa dikenai biaya.</p>
        <h2>2. Sumber dan metode aktivasi</h2>
        <p>PrimeHub berkomitmen menawarkan produk yang diperoleh secara sah dan menjalankan pemenuhan pesanan dengan metode yang sesuai ketentuan penyedia layanan. Produk pihak ketiga bukan berarti PrimeHub merupakan pemilik atau perwakilan resmi merek tersebut. Nama dan merek pihak ketiga tetap milik pemiliknya masing-masing.</p>
        <h2>3. Pemesanan dan pembayaran</h2>
        <p>Pelanggan wajib memberikan nama dan kontak yang benar untuk keperluan pesanan. Ikuti instruksi pembayaran yang dikonfirmasi admin. Jangan membayar ke rekening atau nomor yang tidak dapat diverifikasi sebagai milik pihak yang ditunjuk PrimeHub. Pesanan baru dianggap dibayar setelah admin memverifikasi pembayaran.</p>
        <h2>4. Penyerahan dan keamanan akun</h2>
        <p>Penyerahan dilakukan setelah detail pesanan dan pembayaran dikonfirmasi. Jangan mengirim password, PIN, kode OTP, kode pemulihan, atau informasi pembayaran rahasia kepada admin atau pihak lain. Pelanggan bertanggung jawab menjaga kredensial akunnya dan mengikuti ketentuan layanan dari penyedia yang bersangkutan.</p>
        <h2>5. Garansi, pembatalan, dan pengembalian dana</h2>
        <p>Jika pesanan tidak diserahkan, tidak sesuai dengan deskripsi yang dikonfirmasi, atau akses tidak dapat dipulihkan/diganti selama masa yang dijanjikan, pelanggan dapat meminta penggantian yang sesuai atau pengembalian dana. Pembayaran ganda dan pesanan yang dibatalkan oleh PrimeHub juga dapat diajukan untuk refund. Detail proses terdapat pada <a href="/primehub/pengembalian-dana/">Kebijakan Garansi dan Pengembalian Dana</a>.</p>
        <h2>6. Data pribadi</h2>
        <p>PrimeHub menggunakan data yang diperlukan untuk memproses pesanan, mengonfirmasi pembayaran, memberi dukungan, menjaga keamanan, dan memenuhi kewajiban hukum. Detail selengkapnya tersedia di <a href="/primehub/kebijakan-privasi/">Kebijakan Privasi</a>. Jangan kirim data sensitif yang tidak diperlukan.</p>
        <h2>7. Dukungan dan keluhan</h2>
        <p>Untuk pertanyaan atau keluhan, siapkan kode pesanan dan jelaskan masalahnya melalui kanal komunikasi yang digunakan saat transaksi atau kanal dukungan resmi PrimeHub yang diumumkan. Jangan menyertakan password, PIN, OTP, atau kode pemulihan.</p>
        <h2>8. Perubahan ketentuan</h2>
        <p>Ketentuan dapat diperbarui untuk mencerminkan perubahan layanan atau kewajiban hukum. Ketentuan yang berlaku untuk suatu pesanan adalah ketentuan yang ditampilkan dan dikonfirmasi saat pemesanan, dengan tetap memperhatikan hak konsumen yang diwajibkan hukum.</p>
        <a className="button button-primary" href="/primehub/">Kembali ke PrimeHub</a>
      </article>
      <footer className="site-footer"><div className="container footer-bottom"><span>© 2026 PrimeHub</span><a href="/primehub/">Beranda</a><a href="/primehub/kebijakan-privasi/">Kebijakan Privasi</a><a href="/primehub/pengembalian-dana/">Pengembalian Dana</a></div></footer>
    </main>
  );
}
