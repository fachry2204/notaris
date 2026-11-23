<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class QuotationPublisher
{
    public function __construct(private readonly NotificationGateway $notifications) {}

    public function publish(object $quotation): string
    {
        return DB::transaction(function () use ($quotation) {
            $current = DB::table('quotation')->where('id', $quotation->id)->lockForUpdate()->first();
            if (! $current || $current->status !== 'Draft') {
                throw ValidationException::withMessages(['publish' => 'Hanya quotation berstatus Draft yang dapat diterbitkan.']);
            }
            $now = now();
            DB::table('quotation_publications')->insertOrIgnore(['id' => 'qpub-'.Str::lower(Str::random(16)), 'quotationId' => $quotation->id, 'createdAt' => $now, 'updatedAt' => $now]);
            DB::table('quotation_publications')->where('quotationId', $quotation->id)->update(['publishedAt' => $now, 'updatedAt' => $now]);
            DB::table('quotation')->where('id', $quotation->id)->update(['status' => 'Diterbitkan', 'updatedAt' => $now]);
            return 'Quotation berhasil diterbitkan dan dapat digunakan untuk membuat invoice.';
        });
    }

    public function notify(object $quotation): array
    {
        if (! in_array($quotation->status, ['Diterbitkan', 'Dikirim', 'Disetujui', 'Invoice Terbuat'], true)) {
            throw ValidationException::withMessages(['notification' => 'Terbitkan quotation sebelum mengirim pesan.']);
        }
        return $this->notifications->notify('quotation', $this->data($quotation));
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

}
