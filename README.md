# pleazure.cc — Website Rental Sepeda (Fase 1)

Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma 6 + MySQL 8.

## Menjalankan

```bash
npm install
cp .env.example .env          # isi DATABASE_URL, AUTH_SECRET (≥32 karakter), CRON_SECRET
npx prisma migrate dev        # buat tabel
npm run db:seed               # data contoh + akun
npm run dev                   # http://localhost:3000
```

Akun contoh: `admin@pleazure.cc / admin12345` (admin), `staf@pleazure.cc / staf12345` (staf).
Tarif, jumlah unit, nomor WA, dan rekening di seed masih **placeholder**. Ubah di Dashboard → Armada & Pengaturan.

## Isi Fase 1

| Area | Halaman / endpoint |
| --- | --- |
| Landing, katalog, stok real-time, kalkulator, S&K, peta | `/`, `/sepeda`, `/sepeda/[slug]`, `/syarat` |
| Booking + hold unit (jam mulai + 30 menit) | `POST /api/bookings` (transaction + `SELECT … FOR UPDATE`) |
| Status & invoice ber-QR, PDF | `/booking/[token]`, `/api/invoices/[token]/pdf` |
| Cek booking (kode + no. WA) | `/cek-booking` |
| Login staf/admin | `/admin/login` |
| Ringkasan hari ini, daftar & detail booking, Konfirmasi Bayar, batal | `/admin`, `/admin/booking` |
| Scanner check-in / check-out + denda | `/admin/scan` (kamera HP atau ketik kode) |
| Armada (model, unit, tarif) & pengaturan denda/hold | `/admin/armada`, `/admin/pengaturan` (khusus admin) |
| Expire hold | `GET /api/cron/expire-holds` dengan header `Authorization: Bearer $CRON_SECRET` |

Logika harga ada di satu tempat (`src/lib/pricing.ts`) dan dipakai bersama oleh kalkulator dan backend.

## Cron

Panggil tiap 1 menit, misalnya `* * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/expire-holds`.
`vercel.json` sudah menyertakan jadwal ini, tetapi paket Vercel Hobby hanya mengizinkan cron harian.
Tanpa cron pun stok tetap benar: hold yang sudah lewat tidak dihitung, dan booking di-expire saat dibaca.

## Fase 2: payment gateway (DITUNDA)

Kode ada di `src/lib/payment/`. `manual.ts` aktif sekarang. Kerangka `qris-dinamis.ts` (dengan TODO) dan
`/api/webhooks/payment` dimatikan selama `PAYMENT_GATEWAY_ENABLED` tidak bernilai `"true"`.
Alur booking hanya memanggil interface `createPayment()` / `handleNotification()`, jadi alurnya tidak perlu diubah.

## Catatan produksi

- Rate limit login dan booking disimpan di memori, cukup untuk 1 instance/VPS. Untuk multi-instance, ganti dengan Redis.
- Foto sepeda berupa URL. Kalau kosong, ilustrasi berwarna per kategori ditampilkan otomatis.
- Scanner kamera membutuhkan HTTPS (atau localhost).
