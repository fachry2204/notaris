<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotation', function (Blueprint $table) {
            $table->text('cancellationReason')->nullable()->after('terms');
            $table->dateTime('cancelledAt', 3)->nullable()->after('cancellationReason');
        });
    }

    public function down(): void
    {
        Schema::table('quotation', function (Blueprint $table) {
            $table->dropColumn(['cancellationReason', 'cancelledAt']);
        });
    }
};
