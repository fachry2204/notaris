<?php

namespace App\Services;

use App\Support\JobDateRange;
use Illuminate\Support\Facades\DB;

class KpiReportDataService
{
    public function build(array $employee, JobDateRange $range, string $sort, bool $report, string $periodLabel): array
    {
        $id = $employee['id'];
        $jobs = collect();
        foreach (['badan_hukum' => 'Badan Hukum/Usaha', 'non_badan_hukum' => 'Non Badan Hukum', 'ppat' => 'PPAT'] as $table => $label) {
            $jobs = $jobs->concat($range->apply(DB::table($table))->where('staffId', $id)
                ->select('id', 'title', 'trackingCode', 'status', 'deadline', 'createdAt', 'updatedAt')
                ->orderBy('createdAt', $sort)->when(! $report, fn ($query) => $query->limit(10))->get()->map(function ($job) use ($table, $label) {
                    $job->jobType = $table;
                    $job->category = $label;
                    return $job;
                }));
        }
        $tasks = $range->apply(DB::table('job_employee_task as t'), 't.createdAt')
            ->leftJoin('badan_hukum as bh', 'bh.id', '=', 't.badanHukumId')
            ->leftJoin('non_badan_hukum as nbh', 'nbh.id', '=', 't.nonBadanHukumId')
            ->leftJoin('ppat as p', 'p.id', '=', 't.ppatId')
            ->where('t.userId', $id)
            ->select('t.id', 't.taskType', 't.customTask', 't.createdAt', 't.workStatus', 't.targetDate', 't.completedAt')
            ->selectRaw('COALESCE(bh.title, nbh.title, p.title) as jobTitle')
            ->orderBy('t.createdAt', $sort)->when(! $report, fn ($query) => $query->limit(10))->get();
        $profile = DB::table('staff')->where('userId', $id)->first();
        $employee['photoPath'] = $profile?->photoPath;
        if ($report) {
            $personal = DB::table('user')->where('id', $id)->select('email', 'phone', 'birthday', 'isActive')->first();
            $employee = [...$employee, ...(array) $personal];
        }
        $attendance = $profile ? DB::table('attendance')->where('staffId', $profile->id)
            ->whereBetween('date', [$range->start ?? now()->startOfMonth(), ($range->end ?? now()->endOfDay())->min(now()->endOfDay())])
            ->select('date', 'checkIn', 'checkOut')->orderBy('date', $sort)->get() : collect();

        return [
            'employee' => $employee,
            'periodLabel' => $range->start ? $range->start->translatedFormat('d M Y').' - '.$range->end->translatedFormat('d M Y') : $periodLabel,
            'filters' => [...$range->filters(), 'sort' => $sort],
            'jobs' => ($sort === 'asc' ? $jobs->sortBy('createdAt') : $jobs->sortByDesc('createdAt'))->when(! $report, fn ($items) => $items->take(10))->values(),
            'tasks' => $tasks,
            'attendance' => $attendance,
        ];
    }
}
