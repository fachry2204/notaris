<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('quotationNumber', 191)->unique();
            $table->string('clientId', 191)->index();
            $table->string('picUserId', 191)->index();
            $table->string('subject', 191);
            $table->date('quotationDate');
            $table->date('validUntil')->nullable();
            $table->enum('status', ['Draft', 'Dikirim', 'Disetujui', 'Ditolak', 'Kedaluwarsa', 'Dibatalkan'])->default('Draft')->index();
            $table->decimal('subtotal', 18, 2)->default(0);
            $table->decimal('discount', 18, 2)->default(0);
            $table->decimal('taxPercent', 5, 2)->default(0);
            $table->decimal('taxAmount', 18, 2)->default(0);
            $table->decimal('grandTotal', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->dateTime('createdAt', 3)->useCurrent();
            $table->dateTime('updatedAt', 3)->useCurrent();
        });

        Schema::create('quotation_item', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('quotationId', 191)->index();
            $table->text('description');
            $table->decimal('quantity', 12, 2)->default(1);
            $table->string('unit', 50)->default('item');
            $table->decimal('unitPrice', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->default(0);
            $table->unsignedInteger('sortOrder')->default(0);
            $table->dateTime('createdAt', 3)->useCurrent();
            $table->dateTime('updatedAt', 3)->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_item');
        Schema::dropIfExists('quotation');
    }
};
