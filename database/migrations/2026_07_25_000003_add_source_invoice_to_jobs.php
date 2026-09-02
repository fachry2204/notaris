<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'badan_hukum' => 'badanHukumId',
        'non_badan_hukum' => 'nonBadanHukumId',
        'ppat' => 'ppatId',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table => $foreignKey) {
            if (! Schema::hasColumn($table, 'sourceInvoiceId')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->string('sourceInvoiceId')->nullable()->after('invoiceStatus')->index();
                });
            }

            DB::table('invoice')
                ->whereNotNull($foreignKey)
                ->orderBy('createdAt')
                ->each(function (object $invoice) use ($table, $foreignKey) {
                    DB::table($table)
                        ->where('id', $invoice->{$foreignKey})
                        ->whereNull('sourceInvoiceId')
                        ->update(['sourceInvoiceId' => $invoice->id]);
                });
        }

        $orphanInvoices = DB::table('invoice as i')
            ->join('quotation as q', 'q.id', '=', 'i.quotationId')
            ->whereNull('i.badanHukumId')
            ->whereNull('i.nonBadanHukumId')
            ->whereNull('i.ppatId')
            ->whereNotNull('q.clientId')
            ->select('i.id', 'i.status', 'i.createdAt', 'q.clientId')
            ->orderBy('i.createdAt')
            ->get();

        foreach ($orphanInvoices as $invoice) {
            $candidate = collect(self::TABLES)
                ->map(function (string $foreignKey, string $table) use ($invoice) {
                    $job = DB::table($table)
                        ->where('clientId', $invoice->clientId)
                        ->where('createdAt', '>=', $invoice->createdAt)
                        ->whereNull('sourceInvoiceId')
                        ->orderBy('createdAt')
                        ->first(['id', 'createdAt']);

                    return $job ? compact('table', 'foreignKey', 'job') : null;
                })
                ->filter()
                ->sortBy(fn (array $item) => $item['job']->createdAt)
                ->first();

            if (! $candidate) {
                continue;
            }

            $invoiceStatus = match ($invoice->status) {
                'Lunas' => 'LUNAS',
                'DP Bayar' => 'DP',
                default => 'PENDING',
            };

            DB::table($candidate['table'])
                ->where('id', $candidate['job']->id)
                ->update([
                    'sourceInvoiceId' => $invoice->id,
                    'invoiceStatus' => $invoiceStatus,
                ]);

            DB::table('invoice')
                ->where('id', $invoice->id)
                ->update([
                    $candidate['foreignKey'] => $candidate['job']->id,
                    'updatedAt' => now(),
                ]);
        }
    }

    public function down(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            if (Schema::hasColumn($table, 'sourceInvoiceId')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropIndex(['sourceInvoiceId']);
                    $blueprint->dropColumn('sourceInvoiceId');
                });
            }
        }
    }
};
