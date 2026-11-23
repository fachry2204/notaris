<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('uploaded_job_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('job_type', 30);
            $table->string('job_id');
            $table->string('file_path');
            $table->string('file_name');
            $table->date('document_date');
            $table->string('receiver');
            $table->string('submitter');
            $table->string('uploaded_by')->nullable();
            $table->timestamp('created_at');
            $table->index(['job_type', 'job_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('uploaded_job_receipts'); }
};
