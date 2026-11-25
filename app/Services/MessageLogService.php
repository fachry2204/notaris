<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class MessageLogService
{
    public function send(string $channel, string $category, array $data, array $message, callable $deliver): void
    {
        $id = (string) Str::uuid();
        $phone = NotificationGateway::normalizeIndonesianPhone((string) ($data['clientPhone'] ?? ''));
        DB::table('message_logs')->insert([
            'id' => $id,
            'category' => $category,
            'channel' => $channel,
            'recipient_name' => $data['employeeName'] ?? $data['clientName'] ?? null,
            'recipient_position' => $category === 'test' ? 'TEST' : ($category === 'attendance' ? ($data['recipientRole'] ?? 'STAFFADMIN') : 'CLIENT'),
            'phone' => $phone,
            'destination' => $channel === 'email' ? (string) ($data['clientEmail'] ?? '') : ($phone ?? (string) ($data['clientPhone'] ?? '')),
            'subject' => $channel === 'email' ? $message['subject'] : null,
            'body' => $message[$channel],
            'status' => 'SENDING',
            'status_note' => 'Pengiriman sedang diproses. Konfirmasi penerimaan belum tersedia.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $deliver();
        } catch (Throwable $exception) {
            // Never persist raw gateway errors: they may contain credentials or request headers.
            DB::table('message_logs')->where('id', $id)->update([
                'status' => 'FAILED',
                'status_note' => 'Pengiriman gagal. Periksa tujuan, konfigurasi kanal, atau koneksi layanan.',
                'updated_at' => now(),
            ]);
            throw $exception;
        }

        DB::table('message_logs')->where('id', $id)->update([
            'status' => 'ACCEPTED',
            'status_note' => 'Diterima layanan pengiriman. Belum ada konfirmasi pesan sampai atau dibaca oleh penerima.',
            'updated_at' => now(),
        ]);
    }
}
