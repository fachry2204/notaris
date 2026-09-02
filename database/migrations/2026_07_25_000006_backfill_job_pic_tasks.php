<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('job_employee_task')) {
            return;
        }

        foreach ([
            'badan_hukum' => 'badanHukumId',
            'non_badan_hukum' => 'nonBadanHukumId',
            'ppat' => 'ppatId',
        ] as $jobTable => $foreignKey) {
            if (! Schema::hasTable($jobTable) || ! Schema::hasColumn($jobTable, 'staffId')) {
                continue;
            }

            DB::table($jobTable)
                ->whereNotNull('staffId')
                ->where('staffId', '<>', '')
                ->select('id', 'staffId')
                ->orderBy('id')
                ->each(function (object $job) use ($foreignKey): void {
                    $alreadyExists = DB::table('job_employee_task')
                        ->where($foreignKey, $job->id)
                        ->where('taskType', 'PIC')
                        ->exists();

                    if ($alreadyExists || ! DB::table('user')->where('id', $job->staffId)->exists()) {
                        return;
                    }

                    DB::table('job_employee_task')->insert([
                        'id' => 'JET-PIC-'.Str::lower(Str::random(10)),
                        'userId' => $job->staffId,
                        'taskType' => 'PIC',
                        'customTask' => null,
                        $foreignKey => $job->id,
                        'createdAt' => now(),
                        'updatedAt' => now(),
                    ]);
                });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_employee_task')) {
            DB::table('job_employee_task')
                ->where('id', 'like', 'JET-PIC-%')
                ->delete();
        }
    }
};
