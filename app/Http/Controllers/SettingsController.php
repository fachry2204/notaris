<?php

namespace App\Http\Controllers;

use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsController extends Controller
{
    private const KEY = 'GLOBAL_APP_SETTINGS';

    public function index(DocumentNumberService $numbers)
    {
        return Inertia::render('Settings', [
            'settings' => array_replace_recursive(
                [
                    'documentNumbers' => $numbers->prefixes(),
                    'email' => [
                        'enabled' => false,
                        'host' => 'smtp.gmail.com',
                        'port' => 465,
                        'encryption' => 'ssl',
                        'username' => '',
                        'appPassword' => '',
                        'fromAddress' => '',
                        'fromName' => 'Notaris Digital',
                    ],
                    'whatsapp' => [
                        'enabled' => false,
                        'provider' => 'fonnte',
                        'endpointUrl' => 'https://api.fonnte.com/send',
                        'apiToken' => '',
                    ],
                ],
                $this->read(),
            ),
            'admins' => DB::table('user')
                ->whereIn('role', ['ADMINISTRATOR', 'PIMPINAN'])
                ->select('id', 'fullName', 'username', 'email', 'role', 'isActive')
                ->orderBy('fullName')
                ->get(),
        ]);
    }

    public function update(Request $request)
    {
        $current = $this->read();
        $data = $request->validate([
            'general.appName' => 'required|string|max:255',
            'general.officeName' => 'required|string|max:255',
            'general.officeAddress' => 'nullable|string',
            'general.officeEmail' => 'nullable|email',
            'general.officePhone' => 'nullable|string|max:255',
            'branding.logoUrl' => 'nullable|string|max:500',
            'branding.faviconUrl' => 'nullable|string|max:500',
            'branding.primaryColor' => 'nullable|string|max:30',
            'finance.bankName' => 'nullable|string|max:255',
            'finance.accountNumber' => 'nullable|string|max:255',
            'finance.accountName' => 'nullable|string|max:255',
            'documentNumbers' => 'required|array',
            'documentNumbers.quotation' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'documentNumbers.invoice' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'documentNumbers.badan_hukum' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'documentNumbers.non_badan_hukum' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'documentNumbers.ppat' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'email.enabled' => 'required|boolean',
            'email.host' => 'required_if:email.enabled,true|nullable|string|max:255',
            'email.port' => 'required_if:email.enabled,true|nullable|integer|min:1|max:65535',
            'email.encryption' => 'required_if:email.enabled,true|nullable|in:ssl,tls',
            'email.username' => 'required_if:email.enabled,true|nullable|email|max:255',
            'email.appPassword' => 'required_if:email.enabled,true|nullable|string|max:255',
            'email.fromAddress' => 'required_if:email.enabled,true|nullable|email|max:255',
            'email.fromName' => 'required_if:email.enabled,true|nullable|string|max:255',
            'roles' => 'nullable|array',
            'roles.*.id' => 'required|string|max:100',
            'roles.*.name' => 'required|string|max:100',
            'roles.*.color' => 'nullable|string|max:50',
            'roles.*.permissions' => 'required|array',
            'whatsapp.provider' => 'nullable|string|max:100',
            'whatsapp.enabled' => 'required|boolean',
            'whatsapp.endpointUrl' => 'required_if:whatsapp.enabled,true|nullable|url|max:500',
            'whatsapp.apiToken' => 'required_if:whatsapp.enabled,true|nullable|string|max:1000',
        ]);
        $data['documentNumbers'] = collect($data['documentNumbers'])
            ->map(fn (string $prefix) => strtoupper(trim($prefix)))
            ->all();
        $next = array_replace_recursive($current, $data);
        $this->encryptSecrets($next);

        DB::table('app_settings')->updateOrInsert(
            ['settings_key' => self::KEY],
            [
                'id' => 'settings-global',
                'settings_value' => json_encode($next),
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
        Cache::forget('app.global-branding');

        return back()->with('success', 'Pengaturan disimpan.');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'type' => 'required|in:logo,favicon',
            'file' => 'required|image|max:2048',
        ]);
        $path = '/'.$request->file('file')->store('uploads/settings', 'public_root');

        return response()->json(['url' => $path]);
    }

    private function read(): array
    {
        $row = DB::table('app_settings')->where('settings_key', self::KEY)->first();
        $settings = $row ? json_decode($row->settings_value, true) ?: [] : [];

        foreach ([['email', 'appPassword'], ['whatsapp', 'apiToken']] as [$section, $key]) {
            $value = (string) ($settings[$section][$key] ?? '');
            if (str_starts_with($value, 'encrypted:')) {
                try {
                    $settings[$section][$key] = Crypt::decryptString(substr($value, 10));
                } catch (\Throwable) {
                    $settings[$section][$key] = '';
                }
            }
        }

        return $settings;
    }

    private function encryptSecrets(array &$settings): void
    {
        foreach ([['email', 'appPassword'], ['whatsapp', 'apiToken']] as [$section, $key]) {
            $value = trim((string) ($settings[$section][$key] ?? ''));
            $settings[$section][$key] = $value === ''
                ? ''
                : 'encrypted:'.Crypt::encryptString($value);
        }
    }
}
