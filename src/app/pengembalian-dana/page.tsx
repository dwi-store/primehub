import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garansi dan Pengembalian Dana — UPPRIME",
  description: "Jaminan pemenuhan pesanan, penggantian produk, dan pengembalian dana UPPRIME."
};

export default function RefundPage() {
  return (
    <main className="primehub-app legal-shell">
      <header className="site-header"><div className="container nav"><a className="legal-brand" href="/upprime/">UPPRIME</a><a className="button button-secondary button-small" href="/upprime/">Kembali ke toko</a></div></header>
      <article className="legal-document container">
        <span className="eyebrow">PERLINDUNGAN PELANGGAN</span>
        <h1>Garansi dan Pengembalian Dana</h1>
        <p className="legal-updated">Terakhir diperbarui: 22 Oktober 2026</p>
        <p>UPPRIME berkomitmen menyerahkan produk sesuai deskripsi, durasi, dan metode aktivasi yang dikonfirmasi sebelum pembayaran. Bila pesanan tidak terpenuhi atau ada masalah yang memenuhi ketentuan di bawah, pelanggan dapat meminta bantuan, penggantian, atau pengembalian dana.</p>
        <h2>Kapan pelanggan dapat mengajukan?</h2>
        <ul>
          <li>Pembayaran sudah terverifikasi tetapi produk atau akses tidak diserahkan.</li>
          <li>Produk atau durasi yang diterima berbeda secara material dari informasi yang telah dikonfirmasi sebelum pembayaran.</li>
          <li>Akses gagal digunakan, dicabut, atau berhenti selama masa yang dijanjikan dan UPPRIME tidak dapat memulihkan akses atau memberikan pengganti yang sesuai.</li>
          <li>Terjadi pembayaran ganda atau UPPRIME membatalkan pesanan setelah pembayaran diterima.</li>
        </ul>
        <h2>Pilihan penyelesaian</h2>
        <p>UPPRIME akan memeriksa bukti transaksi dan masalah yang dilaporkan. Pelanggan dapat memilih penggantian yang setara bila tersedia dan disetujui pelanggan, atau pengembalian dana jika pesanan tidak dapat dipenuhi atau masalah tidak dapat diselesaikan. Pengembalian dana tidak menghilangkan hak pelanggan yang diberikan oleh hukum yang berlaku.</p>
        <h2>Cara mengajukan</h2>
        <ol>
          <li>Siapkan kode pesanan, bukti pembayaran yang relevan, dan penjelasan singkat tentang masalahnya.</li>
          <li>Hubungi admin melalui kanal komunikasi yang digunakan saat transaksi atau kanal dukungan resmi UPPRIME yang diumumkan.</li>
          <li>Admin memeriksa status pesanan dan memberi kabar tentang penyelesaian. Jangan mengirim kata sandi, PIN, OTP, kode pemulihan, atau nomor kartu penuh.</li>
        </ol>
        <h2>Waktu penyelesaian</h2>
        <p>UPPRIME menargetkan memberi tanggapan awal dalam 2 hari kerja setelah menerima informasi yang cukup. Jika refund disetujui, UPPRIME menargetkan memulai pengembalian dana dalam 7 hari kerja. Waktu sampai dana masuk dapat berbeda sesuai bank atau penyedia pembayaran. Jika informasi pengajuan belum lengkap, admin akan meminta bukti yang diperlukan.</p>
        <h2>Hal yang perlu diketahui</h2>
        <p>Pesanan berstatus menunggu verifikasi bukan bukti bahwa pembayaran telah diterima. Jangan melakukan pembayaran sebelum menerima instruksi yang dapat diverifikasi. Bila pelanggan memilih penggantian, UPPRIME akan menjelaskan produk dan durasi pengganti terlebih dahulu.</p>
        <p>Ketentuan ini tidak membatasi hak konsumen yang tidak dapat dikesampingkan berdasarkan hukum yang berlaku.</p>
        <a className="button button-primary" href="/upprime/">Kembali ke UPPRIME</a>
      </article>
      <footer className="site-footer"><div className="container footer-bottom"><span>© 2026 UPPRIME</span><a href="/upprime/">Beranda</a><a href="/upprime/syarat-ketentuan/">Syarat Layanan</a><a href="/upprime/kebijakan-privasi/">Kebijakan Privasi</a></div></footer>
    </main>
  );
}
