<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_employee_task')) {
            return;
        }

        Schema::create('job_employee_task', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('userId')->index();
            $table->string('taskType');
            $table->string('customTask')->nullable();
            $table->string('badanHukumId')->nullable()->index();
            $table->string('nonBadanHukumId')->nullable()->index();
            $table->string('ppatId')->nullable()->index();
            $table->dateTime('createdAt')->useCurrent();
            $table->dateTime('updatedAt')->useCurrent();

            $table->index(
                ['userId', 'taskType'],
                'job_employee_task_user_type_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_employee_task');
    }
};
