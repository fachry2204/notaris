<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;

class TaskStatusArchive
{
    public static function removed($tasks): void
    {
        foreach ($tasks as $task) {
            DB::table('task_status_history')->insert([
                'taskId' => $task->id, 'userId' => $task->userId,
                'taskLabel' => $task->customTask ?: $task->taskType,
                'oldStatus' => $task->workStatus, 'newStatus' => null,
                'targetDate' => $task->targetDate,
                'actorId' => session('auth_user.id'),
                'reason' => 'Penugasan dihapus dari berkas.', 'createdAt' => now(),
            ]);
        }
    }
}
