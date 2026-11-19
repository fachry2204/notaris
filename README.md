# Notaris Digital

Sistem administrasi kantor notaris berbasis Laravel 12, Vue 3, Inertia.js, TypeScript, Tailwind CSS, dan MySQL.

## Menjalankan lokal

```bash
composer install
npm install
npm run build
php artisan serve
```

Salin `.env.example` menjadi `.env`, lalu atur `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` sesuai server MySQL. Buat database `notaris` dan impor database aplikasi melalui phpMyAdmin atau MySQL sebelum menjalankan migrasi. Sistem menggunakan tabel MySQL yang ada secara langsung, sehingga data client, berkas, akun, invoice, keuangan, dan absensi tetap tersedia.

Untuk pengujian, buat database MySQL **terpisah** bernama `notaris_test` dan isi dengan skema dan data uji yang aman. Atur kredensialnya melalui variabel lingkungan pengujian jika berbeda. Jangan gunakan database aplikasi atau produksi untuk pengujian.

## Pemeriksaan

```bash
php artisan test
npm run build
php artisan optimize
```

Petunjuk hosting tersedia di [PLESK_DEPLOYMENT.md](PLESK_DEPLOYMENT.md).
