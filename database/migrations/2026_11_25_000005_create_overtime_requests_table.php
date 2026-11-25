<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->date('date');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedInteger('minutes');
            $table->text('reason');
            $table->string('status', 20)->default('PENDING');
            $table->string('reviewed_by')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date', 'status']);
        });
    }

    public function down(): void { Schema::dropIfExists('overtime_requests'); }
};
