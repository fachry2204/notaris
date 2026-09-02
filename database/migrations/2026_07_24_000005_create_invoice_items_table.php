<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_item', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('invoiceId', 191);
            $table->text('description');
            $table->decimal('quantity', 12, 2)->default(1);
            $table->string('unit', 50)->default('item');
            $table->decimal('unitPrice', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->unsignedInteger('sortOrder')->default(0);
            $table->dateTime('createdAt', 3)->nullable();
            $table->dateTime('updatedAt', 3)->nullable();

            $table->index(['invoiceId', 'sortOrder']);
            $table->foreign('invoiceId')
                ->references('id')
                ->on('invoice')
                ->cascadeOnDelete();
        });

        DB::table('invoice')
            ->orderBy('id')
            ->each(function (object $invoice) {
                DB::table('invoice_item')->insert([
                    'id' => 'invi-'.strtolower(Str::random(12)),
                    'invoiceId' => $invoice->id,
                    'description' => $invoice->description ?: 'Tagihan',
                    'quantity' => 1,
                    'unit' => 'item',
                    'unitPrice' => $invoice->amount,
                    'total' => $invoice->amount,
                    'sortOrder' => 0,
                    'createdAt' => now(),
                    'updatedAt' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_item');
    }
};
