<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'branding' => fn () => Cache::remember(
                'app.global-branding',
                now()->addMinutes(10),
                function (): array {
                    $stored = [];
                    if (Schema::hasTable('app_settings')) {
                        $value = DB::table('app_settings')
                            ->where('settings_key', 'GLOBAL_APP_SETTINGS')
                            ->value('settings_value');
                        $stored = $value ? json_decode($value, true) ?: [] : [];
                    }

                    return [
                        'appName' => $stored['general']['appName'] ?? 'Notaris Digital',
                        'officeName' => $stored['general']['officeName'] ?? 'Kantor Notaris',
                        'officeAddress' => $stored['general']['officeAddress'] ?? '',
                        'logoUrl' => $stored['branding']['logoUrl'] ?? null,
                        'faviconUrl' => $stored['branding']['faviconUrl'] ?? null,
                        'primaryColor' => in_array(
                            $stored['branding']['primaryColor'] ?? null,
                            [null, '#F47EAB'],
                            true,
                        ) ? '#C99A3D' : $stored['branding']['primaryColor'],
                        'frontend' => [
                            'loginEyebrow' => $stored['frontend']['loginEyebrow'] ?? 'Notaris Digital',
                            'loginTitle' => $stored['frontend']['loginTitle'] ?? 'Selamat datang',
                            'loginSubtitle' => $stored['frontend']['loginSubtitle'] ?? 'Masuk menggunakan akun Anda.',
                            'trackingEyebrow' => $stored['frontend']['trackingEyebrow'] ?? 'Notaris Digital',
                            'trackingTitle' => $stored['frontend']['trackingTitle'] ?? 'Lacak berkas Anda',
                            'trackingSubtitle' => $stored['frontend']['trackingSubtitle'] ?? 'Masukkan nomor berkas, nomor HP, atau email untuk melihat status dan progres berkas.',
                            'trackingPlaceholder' => $stored['frontend']['trackingPlaceholder'] ?? 'Nomor berkas / nomor HP / email',
                        ],
                    ];
                },
            ),
            'auth' => [
                'user' => $request->session()->get('auth_user'),
            ],
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
