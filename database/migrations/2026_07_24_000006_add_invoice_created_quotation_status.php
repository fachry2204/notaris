<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quotation')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan','Invoice Terbuat') NOT NULL DEFAULT 'Draft'");
        }

        if (Schema::hasTable('invoice')) {
            DB::table('quotation')
                ->whereExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('invoice')
                    ->whereColumn('invoice.quotationId', 'quotation.id'))
                ->update([
                    'status' => 'Invoice Terbuat',
                    'updatedAt' => now(),
                ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('quotation')) {
            return;
        }

        DB::table('quotation')
            ->where('status', 'Invoice Terbuat')
            ->update([
                'status' => 'Disetujui',
                'updatedAt' => now(),
            ]);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan') NOT NULL DEFAULT 'Draft'");
        }
    }
};
