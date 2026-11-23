<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('quotation') && DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Diterbitkan','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan','Invoice Terbuat') NOT NULL DEFAULT 'Draft'");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('quotation')) return;
        DB::table('quotation')->where('status', 'Diterbitkan')->update(['status' => 'Dikirim']);
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan','Invoice Terbuat') NOT NULL DEFAULT 'Draft'");
        }
    }
};
