<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_employee_task') && ! Schema::hasColumn('job_employee_task', 'fee')) {
            Schema::table('job_employee_task', function (Blueprint $table) {
                $table->decimal('fee', 15, 2)->default(0)->after('customTask');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_employee_task') && Schema::hasColumn('job_employee_task', 'fee')) {
            Schema::table('job_employee_task', function (Blueprint $table) {
                $table->dropColumn('fee');
            });
        }
    }
};
