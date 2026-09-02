<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_publications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('quotationId')->unique();
            $table->dateTime('emailSentAt')->nullable();
            $table->dateTime('whatsappSentAt')->nullable();
            $table->dateTime('publishedAt')->nullable();
            $table->dateTime('processingAt')->nullable();
            $table->text('lastError')->nullable();
            $table->dateTime('createdAt');
            $table->dateTime('updatedAt');

            $table->foreign('quotationId')
                ->references('id')
                ->on('quotation')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_publications');
    }
};
