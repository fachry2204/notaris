# Deployment Plesk

## Penyebab error Laravel Toolkit

Repository `master` saat ini memakai Laravel 12 dan `composer.lock` mengunci versi
Laravel yang sudah diperbarui. Jika log Plesk masih menampilkan
`Root composer.json requires laravel/framework ^11.31`, berarti Plesk sedang
membangun folder, branch, atau revisi lama. Jangan menonaktifkan Composer security
audit dan jangan menambahkan advisory ke daftar ignore.

## Konfigurasi Plesk

1. Repository: `https://github.com/fachry2204/notaris.git`.
2. Branch deployment: `master`.
3. Application root: folder yang langsung berisi `artisan`, `composer.json`, dan
   `composer.lock` dari repository ini.
4. Document root domain/subdomain: `<application-root>/public`.
5. Gunakan PHP 8.2 atau lebih baru. Aktifkan `pdo_mysql`, `mbstring`, `openssl`,
   `fileinfo`, dan `intl`.
6. Hapus source deployment lama di Plesk hanya setelah memastikan `.env` dan data
   upload sudah dicadangkan, lalu lakukan Pull Updates dari `master`.

Sebelum instalasi dependency, jalankan dari Application root:

```bash
git rev-parse HEAD
grep '"laravel/framework"' composer.json
php scripts/verify-plesk.php
```

Baris kedua wajib menampilkan `^12.64`, dan pemeriksaan wajib berakhir dengan
`Pemeriksaan deployment OK`. Jika file pemeriksaan tidak ditemukan, Plesk belum
memakai source terbaru.

## Perintah deployment

Cara yang direkomendasikan adalah menjalankan satu skrip berikut dari
Application Root:

```bash
bash scripts/plesk-deploy.sh
```

Skrip akan memvalidasi pasangan `composer.json` dan `composer.lock` sebelum
memasang dependency. Jangan mengambil salah satu file Composer dari skeleton
Laravel Plesk atau dari branch lain.

Jika harus menjalankan setiap langkah secara manual, gunakan:

Gunakan `composer install`, bukan `composer update`, agar Plesk memasang versi
yang sudah dikunci dan diuji:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan optimize
```

Salin `.env.example` menjadi `.env` pada instalasi pertama, isi koneksi MySQL
produksi, lalu gunakan `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_URL`
HTTPS yang benar. Folder `storage` dan `bootstrap/cache` harus writable.

Database produksi tidak boleh diproses dengan `migrate:fresh`, `db:wipe`, atau
perintah lain yang menghapus tabel.
