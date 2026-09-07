#!/usr/bin/env bash

set -Eeuo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

echo "[1/7] Memeriksa Application Root dan pasangan Composer"
php scripts/verify-plesk.php

echo "[2/7] Memvalidasi composer.json dan composer.lock"
composer validate --strict --no-check-publish

echo "[3/7] Memasang dependency PHP dari lock file"
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

echo "[4/7] Memasang dependency frontend dari lock file"
npm ci --no-audit --no-fund

echo "[5/7] Membuat asset frontend produksi"
npm run build

echo "[6/7] Memperbarui database tanpa menghapus data"
php artisan migrate --force

echo "[7/7] Membersihkan dan membuat cache produksi"
php artisan optimize:clear
php artisan optimize

echo "Deployment Plesk selesai."
