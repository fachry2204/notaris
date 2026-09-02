<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('invoice', 'quotationId')) {
            Schema::table('invoice', function (Blueprint $table) {
                $table->string('quotationId', 191)->nullable()->unique()->after('ppatId');
            });
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan') NOT NULL DEFAULT 'Draft'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::table('quotation')->where('status', 'Dibatalkan')->update(['status' => 'Ditolak']);
            DB::statement("ALTER TABLE quotation MODIFY status ENUM('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa') NOT NULL DEFAULT 'Draft'");
        }

        if (Schema::hasColumn('invoice', 'quotationId')) {
            Schema::table('invoice', function (Blueprint $table) {
                $table->dropUnique(['quotationId']);
                $table->dropColumn('quotationId');
            });
        }
    }
};
