# Deployment Plesk

1. Set document root domain/subdomain ke folder `public` proyek ini.
2. Gunakan PHP 8.2 atau lebih baru dan aktifkan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, dan `intl`.
3. Salin `.env.example` menjadi `.env`, isi koneksi MySQL produksi, lalu set `APP_ENV=production`, `APP_DEBUG=false`, dan URL HTTPS.
4. Jalankan `composer install --no-dev --optimize-autoloader` dan `npm ci && npm run build`.
5. Jalankan `php artisan optimize`. Arahkan folder `storage` dan `bootstrap/cache` agar writable.

Database lama digunakan langsung. Jangan jalankan `migrate:fresh` atau menghapus tabel produksi.
