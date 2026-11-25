<?php

namespace App\Services;

use App\Mail\SystemNotificationMail;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class NotificationGateway
{
    private const SETTINGS_KEY = 'GLOBAL_APP_SETTINGS';

    public static function whatsappCategoryDefaults(): array
    {
        return ['quotation'=>true, 'invoice'=>true, 'job'=>true, 'attendance'=>false];
    }

    public static function templateDefaults(): array
    {
        return [
            'attendance' => ['subject'=>'Konfirmasi {jenis_absensi} - {nama_karyawan}', 'email'=>"Halo {nama_karyawan},\n\n{jenis_absensi} Anda berhasil tercatat.\nTanggal: {tanggal}\nPukul: {jam}\nLokasi kerja: {jenis_lokasi}\nAlamat: {lokasi}\n\n{nama_kantor}", 'whatsapp'=>"Halo *{nama_karyawan}*,\n\n*{jenis_absensi}* Anda berhasil tercatat.\nTanggal: *{tanggal}*\nPukul: *{jam}*\nLokasi kerja: {jenis_lokasi}\nAlamat: {lokasi}\n\nTerima kasih.\n{nama_kantor}"],
            'quotation' => ['subject' => 'Quotation {nomor} - {perihal}', 'email' => "Yth. {nama_client},\n\nQuotation {nomor} untuk {perihal} telah diterbitkan.\nTotal penawaran: {total}\n\nLihat quotation: {tautan}\n\nHormat kami,\n{pic}", 'whatsapp' => "Yth. {nama_client}, quotation *{nomor}* untuk {perihal} telah diterbitkan.\n\nTotal penawaran: *{total}*\n\nLihat quotation: {tautan}\n\nHormat kami,\n{pic}"],
            'invoice' => ['subject' => 'Invoice {nomor} - {perihal}', 'email' => "Yth. {nama_client},\n\nInvoice {nomor} untuk {perihal} telah tersedia.\nTotal tagihan: {total}\nJatuh tempo: {jatuh_tempo}\nStatus: {status}\n\nLihat invoice: {tautan}\n\nHormat kami,\n{pic}", 'whatsapp' => "Yth. {nama_client}, invoice *{nomor}* untuk {perihal} telah tersedia.\n\nTotal: *{total}*\nJatuh tempo: {jatuh_tempo}\nStatus: {status}\n\nLihat invoice: {tautan}\n\nHormat kami,\n{pic}"],
            'job' => ['subject' => 'Informasi Berkas {nomor} - {perihal}', 'email' => "Yth. {nama_client},\n\nBerikut pembaruan berkas Anda.\nNomor berkas: {nomor}\nPerihal: {perihal}\nStatus saat ini: {status}\n\nPantau berkas: {tautan}\n\nHormat kami,\n{pic}", 'whatsapp' => "Yth. {nama_client}, berikut pembaruan berkas Anda.\n\nNomor: *{nomor}*\nPerihal: {perihal}\nStatus: *{status}*\n\nPantau berkas: {tautan}\n\nHormat kami,\n{pic}"],
        ];
    }

    public static function templatePlaceholders(): array
    {
        $common = ['nama_client', 'nomor', 'perihal', 'tautan', 'pic'];
        return ['quotation' => [...$common, 'total'], 'invoice' => [...$common, 'total', 'jatuh_tempo', 'status'], 'job' => [...$common, 'status'], 'attendance'=>['nama_karyawan','jenis_absensi','tanggal','jam','jenis_lokasi','lokasi','nama_kantor']];
    }

    public function whatsappCategoryEnabled(string $type): bool
    {
        $settings = $this->settings()['whatsapp'];
        return (bool)$settings['enabled'] && ($type === 'test' || (bool)($settings['categories'][$type] ?? false));
    }

    public static function normalizeIndonesianPhone(string $phone): ?string
    {
        // One recipient only: reject list separators instead of joining numbers.
        if (!preg_match('/^\+?[\d\s().-]+$/D', trim($phone))) return null;
        $phone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($phone, '0062')) $phone = substr($phone,2);
        elseif (str_starts_with($phone, '0')) $phone = '62'.substr($phone,1);
        elseif (str_starts_with($phone, '8')) $phone = '62'.$phone;
        return preg_match('/^62[1-9]\d{6,11}$/D', $phone) ? $phone : null;
    }

    public function enabledChannels(): array
    {
        $settings = $this->settings();

        return [
            'email' => (bool) $settings['email']['enabled'],
            'whatsapp' => (bool) $settings['whatsapp']['enabled'],
        ];
    }

    public function notify(string $type, array $data): array
    {
        $channels = $this->enabledChannels();
        $channels['whatsapp'] = $this->whatsappCategoryEnabled($type);
        $sent = [];
        $missing = [];

        if ($channels['email']) {
            if (filter_var($data['clientEmail'] ?? null, FILTER_VALIDATE_EMAIL)) {
                $this->sendEmail($type, $data);
                $sent[] = 'Email';
            } else {
                $missing[] = 'alamat Email client';
            }
        }

        if ($channels['whatsapp']) {
            if (! empty($data['clientPhone'])) {
                $this->sendWhatsapp($type, $data);
                $sent[] = 'WhatsApp';
            } else {
                $missing[] = 'nomor WhatsApp client';
            }
        }

        if (! $channels['email'] && ! $channels['whatsapp']) {
            throw ValidationException::withMessages([
                'notification' => 'Aktifkan Google SMTP atau Fonnte WhatsApp pada menu Pengaturan.',
            ]);
        }

        if (! $sent) {
            throw ValidationException::withMessages([
                'notification' => 'Notifikasi tidak dapat dikirim karena '.implode(' dan ', $missing).' belum valid.',
            ]);
        }

        return $sent;
    }

    public function sendEmail(string $type, array $data): void
    {
        if (!$this->enabledChannels()['email']) return;
        app(MessageLogService::class)->send('email', $type, $data, $this->message($type, $data), fn () => $this->deliverEmail($type, $data));
    }

    private function deliverEmail(string $type, array $data): void
    {
        $settings = $this->settings()['email'];
        if (! $settings['enabled']) {
            return;
        }
        if (empty($settings['username']) || empty($settings['appPassword']) || empty($settings['fromAddress'])) {
            throw new RuntimeException('Konfigurasi Google SMTP belum lengkap.');
        }
        if (! filter_var($data['clientEmail'] ?? null, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Email client belum valid.');
        }

        $scheme = ($settings['encryption'] ?? 'ssl') === 'ssl' ? 'smtps' : 'smtp';
        config([
            'mail.mailers.system_google' => [
                'transport' => 'smtp',
                'scheme' => $scheme,
                'host' => $settings['host'],
                'port' => (int) $settings['port'],
                'username' => $settings['username'],
                'password' => preg_replace('/\s+/', '', $settings['appPassword']),
                'timeout' => 15,
                'local_domain' => parse_url((string) config('app.url'), PHP_URL_HOST),
            ],
        ]);
        app('mail.manager')->forgetMailers();
        $message = $this->message($type, $data);

        Mail::mailer('system_google')
            ->to($data['clientEmail'], $data['clientName'] ?? null)
            ->send(new SystemNotificationMail(
                $message['subject'],
                $message['email'],
                $settings['fromAddress'],
                $settings['fromName'],
            ));
    }

    public function sendWhatsapp(string $type, array $data): void
    {
        if (!$this->whatsappCategoryEnabled($type)) return;
        app(MessageLogService::class)->send('whatsapp', $type, $data, $this->message($type, $data), fn () => $this->deliverWhatsapp($type, $data));
    }

    private function deliverWhatsapp(string $type, array $data): void
    {
        $settings = $this->settings()['whatsapp'];
        if (! $this->whatsappCategoryEnabled($type)) {
            return;
        }
        if (empty($settings['apiToken'])) {
            throw new RuntimeException('Token API Fonnte belum diisi.');
        }
        $target = self::normalizeIndonesianPhone((string)($data['clientPhone'] ?? ''));
        if (!$target) throw new RuntimeException('Nomor WhatsApp penerima belum valid. Gunakan satu nomor Indonesia.');

        $message = $this->message($type, $data);
        $response = Http::asForm()
            ->withHeaders(['Authorization' => $settings['apiToken']])
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(15)
            ->post($settings['endpointUrl'], [
                'target' => $target,
                'message' => $message['whatsapp'],
                'countryCode' => '62',
                'preview' => true,
            ]);

        $this->ensureFonnteSucceeded($response);
    }

    private function message(string $type, array $data): array
    {
        $client = trim((string) ($data['clientName'] ?? 'Client'));
        $number = trim((string) ($data['number'] ?? '-'));
        $title = trim((string) ($data['title'] ?? '-'));
        $status = trim((string) ($data['status'] ?? '-'));
        $url = trim((string) ($data['url'] ?? url('/dashboard')));
        $total = isset($data['total'])
            ? 'Rp '.number_format((float) $data['total'], 0, ',', '.')
            : null;
        $dueDate = ! empty($data['dueDate'])
            ? date('d-m-Y', strtotime((string) $data['dueDate']))
            : '-';
        $pic = trim((string) ($data['picName'] ?? 'Tim Notaris'));

        if (array_key_exists($type, self::templateDefaults())) {
            $templates = array_replace_recursive(self::templateDefaults(), $this->settings()['notificationTemplates'] ?? []);
            $replacements = ['{nama_client}' => $client, '{nomor}' => $number, '{perihal}' => $title, '{status}' => $status, '{tautan}' => $url, '{total}' => $total ?? '-', '{jatuh_tempo}' => $dueDate, '{pic}' => $pic];
            if ($type === 'attendance') $replacements += ['{nama_karyawan}'=>(string)($data['employeeName'] ?? ''), '{jenis_absensi}'=>(string)($data['attendanceType'] ?? ''), '{tanggal}'=>(string)($data['attendanceDate'] ?? ''), '{jam}'=>(string)($data['attendanceTime'] ?? ''), '{jenis_lokasi}'=>(string)($data['workLocationType'] ?? ''), '{lokasi}'=>(string)($data['locationLabel'] ?? ''), '{nama_kantor}'=>(string)($this->settings()['general']['officeName'] ?? 'Kantor Notaris')];
            return array_map(fn ($template) => strtr($template, $replacements), $templates[$type]);
        }

        return match ($type) {
            'test' => [
                'subject' => 'Pesan Uji Notaris Digital',
                'email' => "Ini adalah pesan uji dari Notaris Digital. Jika Anda menerima pesan ini, pengaturan email berhasil mengirim pesan.",
                'whatsapp' => 'Ini adalah pesan uji dari Notaris Digital. Jika Anda menerima pesan ini, pengaturan WhatsApp berhasil mengirim pesan.',
            ],
            'invoice' => [
                'subject' => "Invoice {$number} - {$title}",
                'email' => "Yth. {$client},\n\nInvoice {$number} untuk {$title} telah tersedia.\nTotal tagihan: {$total}\nJatuh tempo: {$dueDate}\nStatus: {$status}\n\nLihat invoice: {$url}\n\nHormat kami,\n{$pic}",
                'whatsapp' => "Yth. {$client}, invoice *{$number}* untuk {$title} telah tersedia.\n\nTotal: *{$total}*\nJatuh tempo: {$dueDate}\nStatus: {$status}\n\nLihat invoice: {$url}\n\nHormat kami,\n{$pic}",
            ],
            'job' => [
                'subject' => "Informasi Berkas {$number} - {$title}",
                'email' => "Yth. {$client},\n\nBerikut pembaruan berkas Anda.\nNomor berkas: {$number}\nPerihal: {$title}\nStatus saat ini: {$status}\n\nPantau berkas: {$url}\n\nHormat kami,\n{$pic}",
                'whatsapp' => "Yth. {$client}, berikut pembaruan berkas Anda.\n\nNomor: *{$number}*\nPerihal: {$title}\nStatus: *{$status}*\n\nPantau berkas: {$url}\n\nHormat kami,\n{$pic}",
            ],
            default => [
                'subject' => "Quotation {$number} - {$title}",
                'email' => "Yth. {$client},\n\nQuotation {$number} untuk {$title} telah diterbitkan.\nTotal penawaran: {$total}\n\nLihat quotation: {$url}\n\nHormat kami,\n{$pic}",
                'whatsapp' => "Yth. {$client}, quotation *{$number}* untuk {$title} telah diterbitkan.\n\nTotal penawaran: *{$total}*\n\nLihat quotation: {$url}\n\nHormat kami,\n{$pic}",
            ],
        };
    }

    private function ensureFonnteSucceeded(Response $response): void
    {
        if (! $response->successful() || $response->json('status') !== true) {
            $detail = $response->json('detail') ?: $response->json('reason') ?: "HTTP {$response->status()}";
            throw new RuntimeException("Fonnte menolak pengiriman ({$detail}).");
        }
    }

    private function settings(): array
    {
        $row = DB::table('app_settings')->where('settings_key', self::SETTINGS_KEY)->first();
        $stored = $row ? json_decode($row->settings_value, true) ?: [] : [];
        foreach ([['email', 'appPassword'], ['whatsapp', 'apiToken']] as [$section, $key]) {
            $value = (string) ($stored[$section][$key] ?? '');
            if (str_starts_with($value, 'encrypted:')) {
                try {
                    $stored[$section][$key] = Crypt::decryptString(substr($value, 10));
                } catch (Throwable) {
                    $stored[$section][$key] = '';
                }
            }
        }

        return array_replace_recursive([
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
                'categories' => self::whatsappCategoryDefaults(),
                'enabled' => false,
                'provider' => 'fonnte',
                'endpointUrl' => 'https://api.fonnte.com/send',
                'apiToken' => '',
            ],
        ], $stored);
    }
}
