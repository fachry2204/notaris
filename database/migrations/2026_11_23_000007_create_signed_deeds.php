<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('signed_deeds', function (Blueprint $table) {
            $table->id(); $table->string('job_type', 30); $table->string('job_id');
            $table->date('signed_date'); $table->string('deed_number')->nullable(); $table->text('notes')->nullable();
            $table->string('recorded_by')->nullable(); $table->timestamps(); $table->unique(['job_type', 'job_id']);
        });
        Schema::create('signed_deed_photos', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('deed_id')->index(); $table->string('file_path'); $table->string('file_name'); $table->timestamp('created_at');
        });
    }
    public function down(): void { Schema::dropIfExists('signed_deed_photos'); Schema::dropIfExists('signed_deeds'); }
};
