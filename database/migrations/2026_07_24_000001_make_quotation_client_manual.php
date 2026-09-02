<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotation', function (Blueprint $table) {
            $table->string('clientName', 191)->nullable()->after('clientId');
            $table->string('clientPhone', 191)->nullable()->after('clientName');
            $table->string('clientEmail', 191)->nullable()->after('clientPhone');
            $table->text('clientAddress')->nullable()->after('clientEmail');
        });

        DB::statement(<<<'SQL'
            UPDATE quotation q
            LEFT JOIN client c ON c.id = q.clientId
            SET q.clientName = COALESCE(c.name, 'Client'),
                q.clientPhone = c.phone,
                q.clientEmail = c.email,
                q.clientAddress = c.address
            WHERE q.clientName IS NULL
        SQL);

        Schema::table('quotation', function (Blueprint $table) {
            $table->string('clientId', 191)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quotation', function (Blueprint $table) {
            $table->dropColumn(['clientName', 'clientPhone', 'clientEmail', 'clientAddress']);
        });
    }
};
