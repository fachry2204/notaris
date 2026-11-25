<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('message_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category', 40);
            $table->string('channel', 20)->index();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_position', 40)->index();
            $table->string('phone', 40)->nullable();
            $table->string('destination');
            $table->string('subject')->nullable();
            $table->text('body');
            $table->string('status', 20)->index();
            $table->string('status_note')->nullable();
            $table->dateTime('created_at')->index();
            $table->dateTime('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_logs');
    }
};
