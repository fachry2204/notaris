<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class QuotationPublisher
{
    public function __construct(private readonly NotificationGateway $notifications) {}

    public function publish(object $quotation, bool $allowWithoutNotification = false): string
    {
        $channels = $this->notifications->enabledChannels();
        $notificationsDisabled = ! $channels['email'] && ! $channels['whatsapp'];
        if ($notificationsDisabled && ! $allowWithoutNotification) {
            throw ValidationException::withMessages([
                'publish' => 'SMTP dan WhatsApp tidak aktif. Konfirmasi penerbitan tanpa notifikasi untuk melanjutkan.',
            ]);
        }
        $publication = $this->begin($quotation->id);

        if ($publication->publishedAt) {
            return 'Quotation sudah pernah diterbitkan.';
        }

        try {
            $data = $this->data($quotation);
            $sent = [];

            if ($channels['email'] && ! $publication->emailSentAt) {
                $this->notifications->sendEmail('quotation', $data);
                $this->mark($quotation->id, ['emailSentAt' => now()]);
                $sent[] = 'Email';
            }

            if ($channels['whatsapp'] && ! $publication->whatsappSentAt) {
                $this->notifications->sendWhatsapp('quotation', $data);
                $this->mark($quotation->id, ['whatsappSentAt' => now()]);
                $sent[] = 'WhatsApp';
            }

            DB::transaction(function () use ($quotation) {
                $now = now();
                DB::table('quotation_publications')->where('quotationId', $quotation->id)->update([
                    'publishedAt' => $now,
                    'processingAt' => null,
                    'lastError' => null,
                    'updatedAt' => $now,
                ]);
                DB::table('quotation')->where('id', $quotation->id)->update([
                    'status' => 'Dikirim',
                    'updatedAt' => $now,
                ]);
            });

            return $notificationsDisabled
                ? 'Quotation berhasil diterbitkan tanpa notifikasi Email dan WhatsApp.'
                : 'Quotation berhasil diterbitkan'.($sent ? ' dan dikirim melalui '.implode(' serta ', $sent) : '').'.';
        } catch (Throwable $exception) {
            $this->mark($quotation->id, [
                'processingAt' => null,
                'lastError' => Str::limit($exception->getMessage(), 2000, ''),
            ]);

            throw new RuntimeException('Pengiriman belum selesai: '.$exception->getMessage(), 0, $exception);
        }
    }

    private function begin(string $quotationId): object
    {
        DB::table('quotation_publications')->insertOrIgnore([
            'id' => 'qpub-'.Str::lower(Str::random(16)),
            'quotationId' => $quotationId,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        return DB::transaction(function () use ($quotationId) {
            $publication = DB::table('quotation_publications')
                ->where('quotationId', $quotationId)
                ->lockForUpdate()
                ->first();

            if ($publication->publishedAt) {
                return $publication;
            }

            if ($publication->processingAt && now()->diffInSeconds($publication->processingAt) < 60) {
                throw ValidationException::withMessages([
                    'publish' => 'Quotation sedang dalam proses penerbitan. Silakan tunggu sebentar.',
                ]);
            }

            DB::table('quotation_publications')->where('quotationId', $quotationId)->update([
                'processingAt' => now(),
                'lastError' => null,
                'updatedAt' => now(),
            ]);

            return $publication;
        });
    }

    private function data(object $quotation): array
    {
        return [
            'clientName' => $quotation->clientName,
            'clientEmail' => $quotation->clientEmail,
            'clientPhone' => $quotation->clientPhone,
            'number' => $quotation->quotationNumber,
            'title' => $quotation->subject,
            'total' => $quotation->grandTotal,
            'dueDate' => $quotation->validUntil,
            'url' => url('/print/quotation/'.$quotation->id),
            'picName' => $quotation->picName ?? 'Tim Notaris',
        ];
    }

    private function mark(string $quotationId, array $values): void
    {
        DB::table('quotation_publications')->where('quotationId', $quotationId)->update([
            ...$values,
            'updatedAt' => now(),
        ]);
    }
}
