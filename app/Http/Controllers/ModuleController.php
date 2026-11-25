<?php

namespace App\Http\Controllers;

use App\Services\KpiReportDataService;
use App\Services\KpiInsightService;
use App\Support\JobDateRange;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function audit(Request $request)
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
        return Inertia::render('Modules/Table', [
            'title' => 'Audit Log',
            'columns' => ['userName', 'activity', 'details', 'ipAddress', 'device', 'createdAt'],
            'rows' => DB::table('activitylog as a')->leftJoin('user as u', function ($join) {
                $join->on(DB::raw('u.id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('a.userId COLLATE utf8mb4_unicode_ci'));
            })->leftJoin('admin as ad', function ($join) {
                $join->on(DB::raw('ad.id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('a.userId COLLATE utf8mb4_unicode_ci'));
            })->select('a.*')->selectRaw('COALESCE(u.fullName, ad.fullName) as userName')->orderByDesc('a.createdAt')->paginate(30),
        ]);
    }

    public function stats(Request $request)
    {
        $range = JobDateRange::fromRequest($request);
        $tables = [
            'badan_hukum' => 'Badan Hukum/Usaha',
            'non_badan_hukum' => 'Non Badan Hukum',
            'ppat' => 'PPAT',
        ];
        $stats = [
            'total' => 0,
            'PENDING' => 0,
            'PROSES' => 0,
            'REVISI' => 0,
            'VERIFIKASI' => 0,
            'SELESAI' => 0,
            'CANCELLED' => 0,
        ];
        $months = collect($range->months())
            ->map(fn ($date) => [
                'key' => $date->format('Y-m'),
                'name' => $date->translatedFormat('M'),
                'year' => $date->format('Y'),
                'total' => 0,
                'completed' => 0,
            ])->keyBy('key');
        $categories = collect();
        $priorities = collect(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])->mapWithKeys(fn ($priority) => [$priority => 0]);
        $deadlines = collect();
        $overdueJobs = collect();
        $recentCompleted = collect();
        $recentJobs = collect();
        $completionDays = collect();
        $thisMonth = 0;
        $previousMonth = 0;

        foreach ($tables as $table => $categoryLabel) {
            $category = [
                'key' => $table,
                'label' => $categoryLabel,
                'total' => 0,
                'completed' => 0,
                'active' => 0,
            ];
            foreach ($range->apply(DB::table($table))->select('status', DB::raw('COUNT(*) total'))->groupBy('status')->get() as $row) {
                $count = (int) $row->total;
                $stats['total'] += $count;
                $key = in_array($row->status, ['REVISI', 'REVISI_PROSES'], true) ? 'REVISI' : $row->status;
                if (array_key_exists($key, $stats)) {
                    $stats[$key] += $count;
                }
                $category['total'] += $count;
                $category['completed'] += $row->status === 'SELESAI' ? $count : 0;
                $category['active'] += ! in_array($row->status, ['SELESAI', 'CANCELLED'], true) ? $count : 0;
            }
            $categories->push($category);

            foreach ($range->apply(DB::table($table))->select('priority', DB::raw('COUNT(*) total'))->groupBy('priority')->get() as $row) {
                if ($priorities->has($row->priority)) {
                    $priorities[$row->priority] += (int) $row->total;
                }
            }

            foreach ($range->apply(DB::table($table))->select('createdAt', 'updatedAt', 'status')->get() as $job) {
                $created = substr((string) $job->createdAt, 0, 7);
                if ($months->has($created)) {
                    $row = $months->get($created);
                    $row['total']++;
                    $months->put($created, $row);
                }
                $updated = substr((string) $job->updatedAt, 0, 7);
                if ($job->status === 'SELESAI' && $months->has($updated)) {
                    $row = $months->get($updated);
                    $row['completed']++;
                    $months->put($updated, $row);
                }
            }

            $thisMonth += DB::table($table)->whereBetween('createdAt', [now()->startOfMonth(), now()->endOfMonth()])->count();
            $previousMonth += DB::table($table)->whereBetween('createdAt', [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()])->count();

            $baseJobQuery = fn () => $range->apply(DB::table($table.' as j'), 'j.createdAt')
                ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
                ->select('j.id', 'j.trackingCode', 'j.title', 'j.deadline', 'j.status', 'j.priority', 'j.createdAt', 'j.updatedAt', 'c.name as clientName')
                ->selectRaw('? as category, ? as jobType', [$categoryLabel, $table]);

            $deadlines = $deadlines->concat(
                $baseJobQuery()
                    ->whereNotIn('j.status', ['SELESAI', 'CANCELLED'])
                    ->whereBetween('j.deadline', [today(), now()->addDays(7)->endOfDay()])
                    ->get()
            );
            $overdueJobs = $overdueJobs->concat(
                $baseJobQuery()
                    ->whereNotIn('j.status', ['SELESAI', 'CANCELLED'])
                    ->whereNotNull('j.deadline')
                    ->whereDate('j.deadline', '<', today())
                    ->get()
            );
            $recentJobs = $recentJobs->concat($baseJobQuery()->orderByDesc('j.createdAt')->limit(30)->get());
            $recentCompleted = $recentCompleted->concat(
                $baseJobQuery()
                    ->where('j.status', 'SELESAI')
                    ->orderByDesc('j.updatedAt')
                    ->limit(5)
                    ->get()
            );
            foreach ($range->apply(DB::table($table))->where('status', 'SELESAI')->whereNotNull('createdAt')->whereNotNull('updatedAt')->select('createdAt', 'updatedAt')->get() as $job) {
                $completionDays->push(max(0, Carbon::parse($job->createdAt)->diffInDays(Carbon::parse($job->updatedAt))));
            }
        }

        $processing = $stats['PROSES'] + $stats['REVISI'] + $stats['VERIFIKASI'];
        $completionRate = $stats['total'] > 0 ? round(($stats['SELESAI'] / $stats['total']) * 100, 1) : 0;
        $growth = $previousMonth > 0
            ? round((($thisMonth - $previousMonth) / $previousMonth) * 100, 1)
            : ($thisMonth > 0 ? 100 : 0);

        return Inertia::render('Modules/Stats', [
            'filters' => $range->filters(),
            'stats' => [...$stats, 'processing' => $processing],
            'summary' => [
                'active' => $stats['PENDING'] + $processing,
                'completionRate' => $completionRate,
                'overdue' => $overdueJobs->count(),
                'dueSoon' => $deadlines->count(),
                'thisMonth' => $thisMonth,
                'monthlyGrowth' => $growth,
                'averageCompletionDays' => $completionDays->isNotEmpty() ? round($completionDays->average(), 1) : 0,
                'clients' => DB::table('client')->count(),
            ],
            'months' => $months->values(),
            'categories' => $categories,
            'priorities' => $priorities->map(fn ($total, $priority) => ['key' => $priority, 'total' => $total])->values(),
            'statusDistribution' => collect([
                ['key' => 'PENDING', 'label' => 'Pending', 'total' => $stats['PENDING'], 'color' => '#f59e0b'],
                ['key' => 'PROCESSING', 'label' => 'Dalam Proses', 'total' => $processing, 'color' => '#3b82f6'],
                ['key' => 'SELESAI', 'label' => 'Selesai', 'total' => $stats['SELESAI'], 'color' => '#10b981'],
                ['key' => 'CANCELLED', 'label' => 'Dibatalkan', 'total' => $stats['CANCELLED'], 'color' => '#94a3b8'],
            ]),
            'deadlines' => $deadlines->sortBy('deadline')->take(6)->values(),
            'overdueJobs' => $overdueJobs->sortBy('deadline')->take(6)->values(),
            'recentCompleted' => $recentCompleted->sortByDesc('updatedAt')->take(6)->values(),
            'recentJobs' => $recentJobs->sortByDesc('createdAt')->take(30)->values(),
            'todayActivities' => DB::table('jobprogress')->whereDate('createdAt', today())->orderByDesc('createdAt')->limit(8)->get(['description', 'statusAfter', 'createdAt']),
        ]);
    }

    public function productivity(Request $request)
    {
        $range = JobDateRange::fromRequest($request);
        $sort = $request->validate(['sort' => ['nullable', 'in:name,newest,oldest']])['sort'] ?? 'name';
        $data = $this->productivityData($range);
        if (! in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true)) {
            $id = $request->session()->get('auth_user.source') === 'user' ? $request->session()->get('auth_user.id') : null;
            $data['staff'] = $data['staff']->where('id', $id)->values();
        }

        if ($sort === 'newest') {
            $data['staff'] = $data['staff']->sortByDesc('createdAt')->values();
        } elseif ($sort === 'oldest') {
            $data['staff'] = $data['staff']->sortBy('createdAt')->values();
        }
        $data['filters'] = [...$range->filters(), 'sort' => $sort];
        if ($range->start) {
            $data['periodLabel'] = $range->start->translatedFormat('d M Y').' - '.$range->end->translatedFormat('d M Y');
        }

        return Inertia::render('Modules/Productivity', $data);
    }

    private function productivityData(?JobDateRange $range = null, ?string $employeeId = null): array
    {
        $staff = DB::table('user')
            ->leftJoin('staff as profile', 'profile.userId', '=', 'user.id')
            ->select('user.id', 'user.fullName', 'user.username', 'user.role', 'user.createdAt', 'profile.division')
            ->when($employeeId, fn ($query) => $query->where('user.id', $employeeId))
            ->whereIn('user.role', ['STAFFADMIN', 'OB', 'ADMINISTRATOR', 'PIMPINAN'])
            ->get()
            ->keyBy('id')
            ->map(fn ($user) => [
                ...(array) $user,
                'completed' => 0,
                'processing' => 0,
                'totalJobs' => 0,
                'totalTasks' => 0,
                'picTasks' => 0,
                'witnessTasks' => 0,
                'presentDays' => 0,
                'lateDays' => 0,
                'absentDays' => null,
                'workingDays' => null,
                'cancelled' => 0,
                'overdue' => 0,
            ]);

        foreach (['badan_hukum', 'non_badan_hukum', 'ppat'] as $table) {
            foreach (($range ? $range->apply(DB::table($table)) : DB::table($table))->whereIn('staffId', $staff->keys())->select('staffId', 'status', 'deadline')->get() as $job) {
                if ($staff->has($job->staffId)) {
                    $row = $staff[$job->staffId];
                    $row['totalJobs']++;
                    if ($job->status === 'CANCELLED') $row['cancelled']++;
                    if (! in_array($job->status, ['SELESAI', 'CANCELLED'], true) && $job->deadline && Carbon::parse($job->deadline)->lt(today())) $row['overdue']++;
                    $job->status === 'SELESAI' ? $row['completed']++ : ($job->status !== 'CANCELLED' ? $row['processing']++ : 0);
                    $staff[$job->staffId] = $row;
                }
            }
        }

        $taskCounts = ($range ? $range->apply(DB::table('job_employee_task')) : DB::table('job_employee_task'))
            ->whereIn('userId', $staff->keys())
            ->select('userId', 'taskType')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('userId', 'taskType')
            ->get();
        foreach ($taskCounts as $taskCount) {
            if (! $staff->has($taskCount->userId)) {
                continue;
            }
            $row = $staff[$taskCount->userId];
            $row['totalTasks'] += (int) $taskCount->total;
            if ($taskCount->taskType === 'PIC') {
                $row['picTasks'] += (int) $taskCount->total;
            }
            if ($taskCount->taskType === 'Saksi') {
                $row['witnessTasks'] += (int) $taskCount->total;
            }
            $staff[$taskCount->userId] = $row;
        }

        $today = now()->startOfDay();
        $monthStart = $range?->start?->copy()->startOfDay() ?? $today->copy()->startOfMonth();
        $periodEnd = $range?->end?->copy()->endOfDay() ?? $today->copy()->endOfDay();
        $attendanceEnd = $periodEnd->min($today->copy()->endOfDay());
        $profiles = DB::table('staff')
            ->whereIn('userId', $staff->keys())->where('attendance_enabled', true)
            ->select('id', 'userId', 'createdAt')
            ->get()
            ->keyBy('userId');
        $attendance = DB::table('attendance')
            ->whereIn('staffId', $profiles->pluck('id'))
            ->whereBetween('date', [$monthStart, $attendanceEnd])
            ->get()
            ->groupBy('staffId');

        foreach ($staff as $userId => $row) {
            $profile = $profiles->get($userId);
            if (! $profile) {
                continue;
            }

            $records = $attendance->get($profile->id, collect());
            $presentDays = $records
                ->filter(fn ($record) => ! empty($record->checkIn))
                ->map(fn ($record) => Carbon::parse($record->date)->toDateString())
                ->unique()
                ->count();
            $lateDays = $records
                ->filter(fn ($record) => ! empty($record->checkIn) && Carbon::parse($record->checkIn)->format('H:i:s') > '08:00:00')
                ->map(fn ($record) => Carbon::parse($record->date)->toDateString())
                ->unique()
                ->count();
            $employmentStart = Carbon::parse($profile->createdAt)->startOfDay();
            $periodStart = $employmentStart->greaterThan($monthStart) ? $employmentStart : $monthStart;
            $workingDays = 0;
            for ($day = $periodStart->copy(); $day->lte($attendanceEnd); $day->addDay()) {
                if ($day->isWeekday()) {
                    $workingDays++;
                }
            }

            $presentWorkdays = $records
                ->filter(fn ($record) => ! empty($record->checkIn))
                ->map(fn ($record) => Carbon::parse($record->date)->startOfDay())
                ->filter(fn ($day) => $day->isWeekday() && $day->betweenIncluded($periodStart, $attendanceEnd))
                ->map(fn ($day) => $day->toDateString())->unique()->count();

            $row['workingDays'] = $workingDays;
            $row['presentDays'] = $presentDays;
            $row['lateDays'] = $lateDays;
            $row['absentDays'] = max(0, $workingDays - $presentWorkdays);
            $staff[$userId] = $row;
        }

        return [
            'staff' => $staff->sortBy(fn ($row) => mb_strtolower($row['fullName'] ?: $row['username']))->values(),
            'periodLabel' => $today->translatedFormat('F Y'),
        ];
    }

    public function productivityShow(Request $request, string $id, KpiReportDataService $reportData, KpiInsightService $insights)
    {
        $role = $request->session()->get('auth_user.role');
        $own = $request->session()->get('auth_user.id') === $id
            && $request->session()->get('auth_user.source') === 'user';
        abort_unless(in_array($role, ['ADMINISTRATOR', 'PIMPINAN'], true) || $own, 403);

        $report = $request->query('report') === '1';
        $range = JobDateRange::fromRequest($request);
        $sort = $request->validate(['sort' => ['nullable', 'in:asc,desc']])['sort'] ?? 'desc';
        $data = $this->productivityData($range, $id);
        $employee = $data['staff']->firstWhere('id', $id);
        abort_unless($employee, 404);
        $payload = $reportData->build($employee, $range, $sort, $report, $data['periodLabel']);
        $allTasks = $report ? $payload['tasks'] : $reportData->build($employee, $range, $sort, true, $data['periodLabel'])['tasks'];
        $payload['kpiScore'] = app(\App\Services\KpiCalculationService::class)->calculate($allTasks, $employee);
        $payload['evaluation'] = $range->start && $range->end
            ? DB::table('kpi_evaluations')->where('user_id', $id)->where('period_start', $range->start->toDateString())->where('period_end', $range->end->toDateString())->first()
            : null;
        if ($report) {
            $payload['insights'] = $insights->generate($employee);
            foreach ($payload['kpiScore']['components'] as $component) {
                $payload['insights'][] = $component['score'] === null
                    ? $component['label'].': data belum mencukupi untuk analisis.'
                    : $component['label'].': '.$component['score'].'% ('.$component['numerator'].' dari '.$component['denominator'].'). Tinjau bersama pegawai dan periksa konteks pekerjaan.';
            }
            $payload['comparison'] = null;
            if ($range->start && $range->end) {
                $days = (int) $range->start->diffInDays($range->end->copy()->startOfDay()) + 1;
                $previousEnd = $range->start->copy()->subDay()->endOfDay();
                $previousStart = $previousEnd->copy()->startOfDay()->subDays($days - 1);
                $previousRange = new JobDateRange($previousStart, $previousEnd);
                $previous = $this->productivityData($previousRange, $id)['staff']->firstWhere('id', $id);
                $firstCompletions = DB::table('task_status_history')
                    ->where('userId', $id)->where('newStatus', 'SELESAI')
                    ->select('taskId')->selectRaw('MIN(createdAt) as firstCompletedAt')->groupBy('taskId');
                $completionDates = DB::query()->fromSub($firstCompletions, 'completed_tasks');
                $previousCompletions = (clone $completionDates)->whereBetween('firstCompletedAt', [$previousStart, $previousEnd])->count();
                $currentCompletions = (clone $completionDates)->whereBetween('firstCompletedAt', [$range->start, $range->end])->count();
                $payload['comparison'] = [
                    'previousCompletions' => $previousCompletions,
                    'currentCompletions' => $currentCompletions,
                    'previousStart' => $previousStart->toDateString(),
                    'previousEnd' => $previousEnd->toDateString(),
                    'currentStart' => $range->start->toDateString(),
                    'currentEnd' => $range->end->toDateString(),
                    'previous' => array_intersect_key($previous, array_flip(['totalJobs', 'totalTasks', 'presentDays', 'lateDays', 'workingDays'])),
                ];
            }
        }

        return $report ? response()->json($payload)->header('Cache-Control', 'private, no-store') : Inertia::render('Modules/ProductivityDetail', $payload);
    }

    public function saveKpiEvaluation(Request $request, string $id)
    {
        abort_unless(in_array($request->session()->get('auth_user.role'), ['ADMINISTRATOR', 'PIMPINAN'], true), 403);
        abort_unless(DB::table('user')->where('id', $id)->exists(), 404);
        $range = JobDateRange::fromRequest($request);
        if (! $range->start || ! $range->end) throw \Illuminate\Validation\ValidationException::withMessages(['period' => 'Pilih periode awal dan akhir untuk menyimpan evaluasi.']);
        $data = $request->validate(['notes' => 'nullable|string|max:5000', 'improvement_plan' => 'nullable|string|max:5000', 'next_target' => 'nullable|string|max:5000']);
        DB::table('kpi_evaluations')->updateOrInsert(['user_id' => $id, 'period_start' => $range->start->toDateString(), 'period_end' => $range->end->toDateString()], [...$data, 'updated_by' => (string) $request->session()->get('auth_user.id'), 'updated_at' => now()]);
        return back()->with('success', 'Evaluasi pimpinan tersimpan.');
    }

    public function deeds(Request $request)
    {
        $query = $this->jobs($request)->join('signed_deeds as deed', function ($join) {
            $join->on('deed.job_id', '=', 'jobs.id')->on('deed.job_type', '=', 'jobs.jobType');
        })->select('jobs.*', 'deed.signed_date', 'deed.deed_number');

        return Inertia::render('Modules/Deeds', [
            'jobs' => (clone $query)->paginate(30)->withQueryString(),
            'totalAkta' => (clone $query)->count(),
            'staff' => DB::table('user')->select('id', 'fullName')->orderBy('fullName')->get(),
            'filters' => $request->only('from', 'to', 'staff', 'witness'),
        ]);
    }

    public function witnesses(Request $request)
    {
        $rows = $this->jobs($request)->whereNotNull('saksi')->where('saksi', '<>', '')->get();
        $grouped = collect();
        foreach ($rows as $job) {
            foreach (array_filter(array_map('trim', explode(',', $job->saksi))) as $name) {
                $grouped->push(['name' => $name, 'job' => $job]);
            }
        }

        return Inertia::render('Modules/Witnesses', ['rows' => $grouped->sortBy('name')->values(), 'search' => (string) $request->query('search')]);
    }

    private function jobs(Request $request)
    {
        $parts = collect(['badan_hukum' => 'Badan Hukum/Usaha', 'non_badan_hukum' => 'Non Badan Hukum', 'ppat' => 'PPAT'])->map(fn ($category, $table) => DB::table($table.' as j')->leftJoin('client as c', 'c.id', '=', 'j.clientId')->leftJoin('user as u', 'u.id', '=', 'j.staffId')->select('j.id', 'j.trackingCode', 'j.title', 'j.status', 'j.invoiceStatus', 'j.saksi', 'j.createdAt', 'j.staffId', 'c.name as clientName', 'u.fullName as staffName')->selectRaw('? as category, ? as jobType', [$category, $table]));
        $union = $parts->shift();
        foreach ($parts as $part) {
            $union->unionAll($part);
        }$q = DB::query()->fromSub($union, 'jobs')->orderByDesc('createdAt');

        return $q->when($request->query('from'), fn ($x, $v) => $x->whereDate('createdAt', '>=', $v))->when($request->query('to'), fn ($x, $v) => $x->whereDate('createdAt', '<=', $v))->when($request->query('staff'), fn ($x, $v) => $x->where('staffId', $v))->when($request->query('witness'), fn ($x, $v) => $x->where('saksi', 'like', "%{$v}%"))->when($request->query('search'), fn ($x, $v) => $x->where(fn ($x) => $x->where('saksi', 'like', "%{$v}%")->orWhere('trackingCode', 'like', "%{$v}%")));
    }
}
