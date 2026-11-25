<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class PwaBrandingService
{
    public function identity(): array
    {
        $stored = json_decode(DB::table('app_settings')->where('settings_key', 'GLOBAL_APP_SETTINGS')->value('settings_value') ?: '{}', true) ?: [];
        $name = trim((string)($stored['general']['appName'] ?? '')) ?: 'Notaris Digital';
        $file = null;
        foreach ([$stored['branding']['faviconUrl'] ?? null, $stored['branding']['logoUrl'] ?? null, '/images/dashboard/nr-gold-logo.png'] as $candidate) {
            if (!is_string($candidate) || !str_starts_with($candidate, '/') || str_starts_with($candidate, '//') || str_contains($candidate, '\\')) continue;
            $path = realpath(public_path(ltrim(explode('?', $candidate)[0], '/')));
            $root = realpath(public_path());
            if (!$path || !$root || !str_starts_with(strtolower($path), strtolower($root.DIRECTORY_SEPARATOR)) || !is_file($path)) continue;
            $info = @getimagesize($path);
            if (!$info || !in_array($info['mime'] ?? '', ['image/png','image/jpeg','image/webp','image/gif'], true) || $info[0]*$info[1]>25000000) continue;
            $file = $path;
            break;
        }
        return ['name'=>$name, 'file'=>$file, 'version'=>substr(hash('sha256', $name.'|'.($file ? hash_file('sha256', $file) : 'default')), 0, 20)];
    }

    public function metadata(): array
    {
        $identity = $this->identity();
        return ['name'=>$identity['name'], 'version'=>$identity['version'], 'manifestUrl'=>route('pwa.manifest'), 'appleIconUrl'=>route('pwa.icon', ['size'=>180, 'v'=>$identity['version']]), 'faviconUrl'=>route('pwa.icon', ['size'=>192, 'v'=>$identity['version']])];
    }

    public function png(int $size, bool $maskable = false): string
    {
        $identity = $this->identity();
        $canvas = imagecreatetruecolor($size, $size);
        imagefill($canvas, 0, 0, imagecolorallocate($canvas, 246, 241, 231));
        $source = $identity['file'] ? @imagecreatefromstring(file_get_contents($identity['file'])) : false;
        if ($source) {
            $max = $size*($maskable ? .56 : .84);
            $ratio = min($max/imagesx($source), $max/imagesy($source));
            $width = max(1, (int)round(imagesx($source)*$ratio));
            $height = max(1, (int)round(imagesy($source)*$ratio));
            imagecopyresampled($canvas, $source, (int)(($size-$width)/2), (int)(($size-$height)/2), 0, 0, $width, $height, imagesx($source), imagesy($source));
            imagedestroy($source);
        } else {
            $gold = imagecolorallocate($canvas, 128, 99, 41);
            imagestring($canvas, 5, (int)(($size-18)/2), (int)(($size-15)/2), 'NR', $gold);
        }
        ob_start(); imagepng($canvas); $png = ob_get_clean(); imagedestroy($canvas);
        return $png;
    }
}
