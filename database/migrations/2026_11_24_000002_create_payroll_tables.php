<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payroll_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->unique();
            $table->unsignedBigInteger('base_salary')->default(0);
            $table->unsignedBigInteger('allowance')->default(0);
            $table->timestamps();
        });
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id();
            $table->string('period', 7)->unique();
            $table->date('payment_date')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->string('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained('payroll_periods')->cascadeOnDelete();
            $table->string('user_id');
            $table->string('employee_name');
            $table->unsignedBigInteger('base_salary');
            $table->unsignedBigInteger('allowance');
            $table->unsignedBigInteger('late_deduction');
            $table->unsignedBigInteger('other_deduction')->default(0);
            $table->unsignedBigInteger('net_salary');
            $table->json('late_details')->nullable();
            $table->timestamps();
            $table->unique(['payroll_period_id', 'user_id']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_periods');
        Schema::dropIfExists('payroll_profiles');
    }
};
