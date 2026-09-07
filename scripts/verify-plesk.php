<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$requiredFiles = ['artisan', 'composer.json', 'composer.lock', 'package.json', 'package-lock.json'];

foreach ($requiredFiles as $requiredFile) {
    if (! is_file($root.'/'.$requiredFile)) {
        $errors[] = "File {$requiredFile} tidak ditemukan. Application Root Plesk salah atau source belum lengkap.";
    }
}

if ($errors !== []) {
    fwrite(STDERR, "Pemeriksaan deployment GAGAL:\n- ".implode("\n- ", $errors)."\n");
    exit(1);
}

if (PHP_VERSION_ID < 80200) {
    $errors[] = 'PHP 8.2 atau lebih baru diperlukan. Versi aktif: '.PHP_VERSION;
}

foreach (['pdo_mysql', 'mbstring', 'openssl', 'fileinfo', 'intl'] as $extension) {
    if (! extension_loaded($extension)) {
        $errors[] = "Ekstensi PHP {$extension} belum aktif.";
    }
}

$composer = json_decode((string) file_get_contents($root.'/composer.json'), true);
if (! is_array($composer)) {
    $errors[] = 'composer.json tidak valid.';
}
$frameworkConstraint = $composer['require']['laravel/framework'] ?? null;
if ($frameworkConstraint !== '^12.64') {
    $errors[] = "Source deployment salah: laravel/framework harus ^12.64, ditemukan {$frameworkConstraint}.";
}
$tinkerConstraint = $composer['require']['laravel/tinker'] ?? null;
if ($tinkerConstraint !== '^2.11.1') {
    $errors[] = "Source deployment salah: laravel/tinker harus ^2.11.1, ditemukan {$tinkerConstraint}.";
}
if (($composer['config']['audit']['block-insecure'] ?? null) !== true) {
    $errors[] = 'Composer security advisory harus tetap aktif (config.audit.block-insecure=true).';
}

$lock = json_decode((string) file_get_contents($root.'/composer.lock'), true);
if (! is_array($lock)) {
    $errors[] = 'composer.lock tidak valid.';
}
$framework = array_values(array_filter(
    $lock['packages'] ?? [],
    fn (array $package): bool => ($package['name'] ?? null) === 'laravel/framework',
))[0] ?? null;
$lockedVersion = $framework['version'] ?? null;
if (! is_string($lockedVersion) || ! preg_match('/^v12\.(?:6[4-9]|[7-9]\d|\d{3,})\./', $lockedVersion)) {
    $errors[] = "composer.lock harus mengunci Laravel minimal v12.64.0. Versi terkunci: {$lockedVersion}.";
}

$lockedTinker = array_values(array_filter(
    $lock['packages'] ?? [],
    fn (array $package): bool => ($package['name'] ?? null) === 'laravel/tinker',
))[0]['version'] ?? null;
if (! is_string($lockedTinker) || version_compare(ltrim($lockedTinker, 'v'), '2.11.1', '<')) {
    $errors[] = "composer.lock harus mengunci Laravel Tinker minimal v2.11.1. Versi terkunci: {$lockedTinker}.";
}

if ($errors !== []) {
    fwrite(STDERR, "Pemeriksaan deployment GAGAL:\n- ".implode("\n- ", $errors)."\n");
    exit(1);
}

fwrite(STDOUT, "Pemeriksaan deployment OK\nLaravel: {$lockedVersion}\nTinker: {$lockedTinker}\nPHP: ".PHP_VERSION."\n");
