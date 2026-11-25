<?php

namespace App\Http\Controllers;

use App\Services\PwaBrandingService;
use Illuminate\Http\Request;

class PwaController extends Controller
{
    public function manifest(PwaBrandingService $branding)
    {
        $identity = $branding->identity();
        $icons = [];
        foreach ([192, 512] as $size) $icons[] = ['src'=>route('pwa.icon', ['size'=>$size, 'v'=>$identity['version']]), 'sizes'=>"{$size}x{$size}", 'type'=>'image/png', 'purpose'=>'any'];
        $icons[] = ['src'=>route('pwa.icon', ['size'=>512, 'maskable'=>1, 'v'=>$identity['version']]), 'sizes'=>'512x512', 'type'=>'image/png', 'purpose'=>'maskable'];
        return response()->json(['id'=>url('/').'/', 'name'=>$identity['name'], 'short_name'=>$identity['name'], 'description'=>'Administrasi dan operasional kantor notaris', 'start_url'=>url('/dashboard'), 'scope'=>url('/').'/', 'display'=>'standalone', 'background_color'=>'#f6f1e7', 'theme_color'=>'#15130f', 'icons'=>$icons], 200, ['Content-Type'=>'application/manifest+json', 'Cache-Control'=>'no-cache, no-store, must-revalidate']);
    }

    public function icon(Request $request, PwaBrandingService $branding, int $size)
    {
        abort_unless(in_array($size, [180,192,512], true), 404);
        return response($branding->png($size, $request->boolean('maskable')), 200, ['Content-Type'=>'image/png', 'Cache-Control'=>'no-cache, must-revalidate', 'X-Content-Type-Options'=>'nosniff']);
    }
}
