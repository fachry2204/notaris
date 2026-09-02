<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const TABLES = [
        'badan_hukum',
        'non_badan_hukum',
        'ppat',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasColumn($table, 'pengurusanUntuk')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->string('pengurusanUntuk')->nullable()->after('type');
                });
            }

            DB::table($table)
                ->whereNull('pengurusanUntuk')
                ->orderBy('createdAt')
                ->each(function (object $job) use ($table) {
                    $prefix = trim((string) $job->type).' - ';
                    $managementFor = Str::startsWith((string) $job->title, $prefix)
                        ? trim(Str::after((string) $job->title, $prefix))
                        : null;

                    if ($managementFor) {
                        DB::table($table)
                            ->where('id', $job->id)
                            ->update(['pengurusanUntuk' => $managementFor]);
                    }
                });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasColumn($table, 'pengurusanUntuk')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropColumn('pengurusanUntuk');
                });
            }
        }
    }
};
