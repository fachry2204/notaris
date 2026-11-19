<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attachment') && ! Schema::hasColumn('attachment', 'isPhysicalDeposited')) {
            Schema::table('attachment', function (Blueprint $table) {
                $table->boolean('isPhysicalDeposited')
                    ->default(false)
                    ->after('description');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('attachment') && Schema::hasColumn('attachment', 'isPhysicalDeposited')) {
            Schema::table('attachment', function (Blueprint $table) {
                $table->dropColumn('isPhysicalDeposited');
            });
        }
    }
};
