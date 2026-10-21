# PrimeHub

**Premium Services. Better Life.**

PrimeHub adalah website katalog layanan digital premium yang dirancang untuk memudahkan pengunjung menemukan layanan, memfilter kategori, dan mengirim permintaan informasi.

## Teknologi

- Next.js App Router
- React + TypeScript
- CSS responsif
- Lucide icons

## Menjalankan secara lokal

Pastikan Node.js versi LTS terpasang.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Untuk memeriksa build produksi:

```bash
npm run build
npm start
```

## Struktur utama

- `src/app/page.tsx` — halaman beranda, katalog, filter pencarian, dan formulir ringkasan permintaan.
- `src/app/globals.css` — desain responsif.
- `src/app/layout.tsx` — metadata dan konfigurasi favicon.
- `public/` — logo dan aset favicon PrimeHub.

## Sebelum diluncurkan

- Ganti data contoh katalog dan isi harga berdasarkan layanan yang benar-benar tersedia.
- Tambahkan kontak resmi, kebijakan privasi, syarat layanan, dan informasi dukungan.
- Hubungkan formulir permintaan ke backend atau kanal kontak yang terverifikasi.
- Integrasikan pembayaran hanya setelah penyedia, harga, dan alur pemesanan sudah dikonfirmasi.
- Pastikan setiap langganan diaktifkan sesuai ketentuan resmi penyedia layanan.

Mode saat ini bergantung pada konfigurasi deployment. Tanpa konfigurasi Supabase publik, katalog menampilkan data contoh dan formulir hanya menghasilkan ringkasan lokal. Setelah `NEXT_PUBLIC_SUPABASE_URL` dan salah satu `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` dikonfigurasi serta skema dan Edge Function Supabase diterapkan, katalog membaca produk aktif dan formulir dapat membuat pesanan berstatus menunggu verifikasi. Integrasi ini belum berarti pembayaran DANA otomatis tersedia; status lunas tidak boleh dipilih sebelum transfer diverifikasi. Lihat `supabase/SETUP.md`.
