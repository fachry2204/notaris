<?php
namespace App\Services;

use Illuminate\Support\Collection;

class KpiCalculationService
{
    public function calculate(Collection $tasks, array $employee): array
    {
        $eligible = $tasks->filter(fn ($t) => in_array($t->workStatus, ['PENDING', 'PROSES', 'SELESAI'], true));
        $completed = $eligible->where('workStatus', 'SELESAI');
        $timed = $completed->filter(fn ($t) => $t->targetDate && $t->completedAt);
        $onTime = $timed->filter(fn ($t) => substr((string) $t->completedAt, 0, 10) <= substr((string) $t->targetDate, 0, 10));
        $present = $employee['workingDays'] === null ? null : (int) $employee['presentDays'];
        $components = [
            'completion' => ['label' => 'Penyelesaian tugas', 'weight' => 40, 'score' => $eligible->count() ? round($completed->count() / $eligible->count() * 100, 1) : null, 'numerator' => $completed->count(), 'denominator' => $eligible->count()],
            'timeliness' => ['label' => 'Selesai tepat target', 'weight' => 30, 'score' => $timed->count() ? round($onTime->count() / $timed->count() * 100, 1) : null, 'numerator' => $onTime->count(), 'denominator' => $timed->count()],
            'punctuality' => ['label' => 'Ketepatan waktu hadir', 'weight' => 30, 'score' => $present ? round(max(0, $present - $employee['lateDays']) / $present * 100, 1) : null, 'numerator' => $present === null ? null : max(0, $present - $employee['lateDays']), 'denominator' => $present],
        ];
        $score = collect($components)->contains(fn ($component) => $component['score'] === null) ? null : round(collect($components)->sum(fn ($component) => $component['score'] * $component['weight']) / 100, 1);
        return ['score' => $score, 'components' => $components, 'unknownTasks' => $tasks->whereNull('workStatus')->count(), 'excludedCancelled' => $tasks->where('workStatus', 'CANCELLED')->count(), 'version' => '1.0'];
    }
}
