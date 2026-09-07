<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];

if (PHP_VERSION_ID < 80200) {
    $errors[] = 'PHP 8.2 atau lebih baru diperlukan. Versi aktif: '.PHP_VERSION;
}

foreach (['pdo_mysql', 'mbstring', 'openssl', 'fileinfo', 'intl'] as $extension) {
    if (! extension_loaded($extension)) {
        $errors[] = "Ekstensi PHP {$extension} belum aktif.";
    }
}

$composer = json_decode((string) file_get_contents($root.'/composer.json'), true);
$frameworkConstraint = $composer['require']['laravel/framework'] ?? null;
if (! is_string($frameworkConstraint) || ! str_starts_with($frameworkConstraint, '^12.')) {
    $errors[] = "Source deployment salah: composer.json harus memakai Laravel ^12.x, ditemukan {$frameworkConstraint}.";
}

$lock = json_decode((string) file_get_contents($root.'/composer.lock'), true);
$framework = array_values(array_filter(
    $lock['packages'] ?? [],
    fn (array $package): bool => ($package['name'] ?? null) === 'laravel/framework',
))[0] ?? null;
$lockedVersion = $framework['version'] ?? null;
if (! is_string($lockedVersion) || ! str_starts_with($lockedVersion, 'v12.')) {
    $errors[] = "composer.lock tidak mengunci Laravel 12. Versi terkunci: {$lockedVersion}.";
}

if ($errors !== []) {
    fwrite(STDERR, "Pemeriksaan deployment GAGAL:\n- ".implode("\n- ", $errors)."\n");
    exit(1);
}

fwrite(STDOUT, "Pemeriksaan deployment OK\nLaravel: {$lockedVersion}\nPHP: ".PHP_VERSION."\n");
