<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('job_progress_photos', function (Blueprint $table) {
            $table->id();
            $table->string('progress_id')->index();
            $table->string('file_path');
            $table->string('file_name');
            $table->timestamp('created_at');
        });
    }
    public function down(): void { Schema::dropIfExists('job_progress_photos'); }
};
