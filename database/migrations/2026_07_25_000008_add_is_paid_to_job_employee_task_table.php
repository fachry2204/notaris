<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('job_employee_task', 'isPaid')) {
            Schema::table('job_employee_task', function (Blueprint $table) {
                $table->boolean('isPaid')->default(false)->after('fee');
                $table->dateTime('paidAt')->nullable()->after('isPaid');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('job_employee_task', 'isPaid')) {
            Schema::table('job_employee_task', function (Blueprint $table) {
                $table->dropColumn(['isPaid', 'paidAt']);
            });
        }
    }
};
