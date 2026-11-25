<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('job_employee_task', function (Blueprint $table) {
            $table->string('workStatus', 20)->nullable();
            $table->date('targetDate')->nullable();
            $table->dateTime('completedAt')->nullable();
        });
        Schema::create('task_status_history', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('taskId')->index();
            $table->string('userId')->index();
            $table->string('taskLabel');
            $table->string('oldStatus', 20)->nullable();
            $table->string('newStatus', 20)->nullable();
            $table->date('targetDate')->nullable();
            $table->string('actorId')->nullable();
            $table->text('reason');
            $table->dateTime('createdAt')->index();
        });
    }
    public function down(): void {
        Schema::dropIfExists('task_status_history');
        Schema::table('job_employee_task', fn (Blueprint $table) => $table->dropColumn(['workStatus', 'targetDate', 'completedAt']));
    }
};
