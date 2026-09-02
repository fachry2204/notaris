# Notaris Digital

Sistem administrasi kantor notaris berbasis Laravel 12, Vue 3, Inertia.js, TypeScript, Tailwind CSS, dan MySQL.

## Menjalankan lokal

```bash
composer install
npm install
npm run build
php artisan serve
```

Isi koneksi database di `.env`. Sistem menggunakan tabel MySQL lama secara langsung, sehingga data client, berkas, akun, invoice, keuangan, dan absensi tetap tersedia.

## Pemeriksaan

```bash
php artisan test
npm run build
php artisan optimize
```

Petunjuk hosting tersedia di [PLESK_DEPLOYMENT.md](PLESK_DEPLOYMENT.md).
