<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrintController extends Controller
{
    public function invoice(string $id)
    {
        $invoice = DB::table('invoice')->where('id', $id)->first();
        abort_unless((bool) $invoice, 404);
        $storedSettings = DB::table('app_settings')
            ->where('settings_key', 'GLOBAL_APP_SETTINGS')
            ->value('settings_value');
        $settings = $storedSettings ? json_decode($storedSettings, true) ?: [] : [];
        $job = null;
        if ($invoice->quotationId) {
            $job = DB::table('quotation as q')->leftJoin('client as c', 'c.id', '=', 'q.clientId')->select('q.id', 'q.subject as title', 'q.quotationNumber as trackingCode', 'q.clientName', 'q.clientAddress', 'q.terms', 'c.name as legacyClientName', 'c.address as legacyClientAddress')->where('q.id', $invoice->quotationId)->first();
            if ($job) {
                $job->clientName = $job->clientName ?: $job->legacyClientName;
                $job->clientAddress = $job->clientAddress ?: $job->legacyClientAddress;
            }
        } else {
            foreach (['badanHukumId' => 'badan_hukum', 'nonBadanHukumId' => 'non_badan_hukum', 'ppatId' => 'ppat'] as $fk => $table) {
                if ($invoice->{$fk}) {
                    $job = DB::table($table.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->select('j.*', 'c.name as clientName', 'c.address as clientAddress')->where('j.id', $invoice->{$fk})->first();
                    break;
                }
            }
        }

        return Inertia::render('Print/Invoice', [
            'invoice' => $invoice,
            'job' => $job,
            'terms' => $invoice->description ?: ($job->terms ?? ''),
            'items' => DB::table('invoice_item')->where('invoiceId', $id)->orderBy('sortOrder')->get(),
            'payments' => DB::table('financerecord')->where('invoiceId', $id)->get(),
            'finance' => [
                'bankName' => $settings['finance']['bankName'] ?? '',
                'accountNumber' => $settings['finance']['accountNumber'] ?? '',
                'accountName' => $settings['finance']['accountName'] ?? '',
            ],
        ]);
    }

    public function receipt(string $type, string $id)
    {
        $normalizedType = str_replace('-', '_', $type);
        abort_unless(in_array($normalizedType, ['badan_hukum', 'non_badan_hukum', 'ppat']), 404);
        $fk = $normalizedType === 'badan_hukum' ? 'badanHukumId' : ($normalizedType === 'non_badan_hukum' ? 'nonBadanHukumId' : 'ppatId');

        $job = DB::table($normalizedType.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->leftJoin('user as staff', 'staff.id', '=', 'j.staffId')
            ->select(
                'j.*',
                'c.name as clientName',
                'c.phone as clientPhone',
                'c.address as clientAddress',
                'c.email as clientEmail',
                'staff.fullName as picName'
            )
            ->where('j.id', $id)
            ->first();
        abort_unless((bool) $job, 404);

        $attachments = DB::table('attachment')
            ->where($fk, $id)
            ->orderBy('createdAt')
            ->get();

        $storedSettings = DB::table('app_settings')
            ->where('settings_key', 'GLOBAL_APP_SETTINGS')
            ->value('settings_value');
        $settings = $storedSettings ? json_decode($storedSettings, true) ?: [] : [];

        return Inertia::render('Print/Receipt', [
            'job' => $job,
            'jobType' => $normalizedType,
            'attachments' => $attachments,
            'settings' => $settings,
        ]);
    }

    public function legacyReceipt(string $id)
    {
        foreach (['badan_hukum', 'non_badan_hukum', 'ppat'] as $type) {
            if (DB::table($type)->where('id', $id)->exists()) {
                return redirect()->route('print.receipt', [$type, $id]);
            }
        }abort(404);
    }
}
