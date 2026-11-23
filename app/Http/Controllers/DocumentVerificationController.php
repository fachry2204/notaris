<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class DocumentVerificationController extends Controller
{
    public static function url(string $type, string $id): string
    {
        return URL::signedRoute('document.verify', ['type' => $type, 'id' => $id]);
    }

    public function show(string $type, string $id)
    {
        $document = match ($type) {
            'invoice', 'kwitansi' => DB::table('invoice')->where('id', $id)->first(),
            'quotation' => DB::table('quotation')->where('id', $id)->first(),
            'tanda-terima-badan_hukum' => DB::table('badan_hukum')->where('id', $id)->first(),
            'tanda-terima-non_badan_hukum' => DB::table('non_badan_hukum')->where('id', $id)->first(),
            'tanda-terima-ppat' => DB::table('ppat')->where('id', $id)->first(),
            default => null,
        };
        abort_unless($document, 404);
        $isReceipt = str_starts_with($type, 'tanda-terima-');
        if ($isReceipt) {
            $jobType = substr($type, strlen('tanda-terima-'));
            $key = match ($jobType) { 'badan_hukum' => 'badanHukumId', 'non_badan_hukum' => 'nonBadanHukumId', 'ppat' => 'ppatId' };
            abort_unless(DB::table('attachment')->where($key, $id)->where('isPhysicalDeposited', true)->exists(), 404);
        }

        return Inertia::render('Public/DocumentVerification', [
            'document' => [
                'type' => match (true) { $isReceipt => 'Tanda terima berkas', $type === 'kwitansi' => 'Kwitansi', $type === 'invoice' => 'Invoice', default => 'Quotation' },
                'number' => $isReceipt ? $document->trackingCode : ($type === 'quotation' ? $document->quotationNumber : $document->invoiceNumber),
                'date' => $isReceipt ? $document->createdAt : ($type === 'quotation' ? $document->quotationDate : $document->date),
                'status' => $type === 'kwitansi' && $document->status !== 'Lunas' ? 'Invoice tidak berstatus lunas' : $document->status,
            ],
        ]);
    }
}
