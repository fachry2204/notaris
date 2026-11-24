<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('payroll_profiles', function (Blueprint $table) {
            $table->json('other_allowances')->nullable();
            $table->unsignedBigInteger('bpjs_health')->default(0);
            $table->unsignedBigInteger('bpjs_employment')->default(0);
        });
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->json('salary_details')->nullable();
        });
        Schema::create('payroll_profile_history', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->string('actor_id')->nullable();
            $table->string('actor_name');
            $table->text('reason');
            $table->json('changes');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('payroll_profile_history');
        Schema::table('payroll_items', fn (Blueprint $table) => $table->dropColumn('salary_details'));
        Schema::table('payroll_profiles', fn (Blueprint $table) => $table->dropColumn(['other_allowances', 'bpjs_health', 'bpjs_employment']));
    }
};
