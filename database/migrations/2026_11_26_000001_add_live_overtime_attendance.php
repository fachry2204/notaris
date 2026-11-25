<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table) {
            $table->dateTime('end_at')->nullable()->change();
            $table->text('attendance_notes')->nullable();
        });
    }
    public function down(): void
    {
        Schema::table('overtime_requests', fn (Blueprint $table) => $table->dropColumn('attendance_notes'));
    }
};
