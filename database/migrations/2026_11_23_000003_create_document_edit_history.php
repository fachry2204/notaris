<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_edit_history', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 20);
            $table->string('document_id');
            $table->string('actor_id')->nullable();
            $table->string('actor_name');
            $table->text('reason');
            $table->json('changes');
            $table->timestamp('created_at');
            $table->index(['document_type', 'document_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('document_edit_history'); }
};
