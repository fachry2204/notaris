<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tables = ['badan_hukum', 'non_badan_hukum', 'ppat'];
        $stats = ['total' => 0, 'pending' => 0, 'processing' => 0, 'completed' => 0];
        $overdueCount = 0;
        $feeIncompleteCount = 0;
        $months = collect(range(5, 0))->map(function ($offset) {
            $date = now()->subMonths($offset);

            return ['key' => $date->format('Y-m'), 'label' => $date->translatedFormat('M'), 'incoming' => 0, 'completed' => 0];
        })->keyBy('key');

        foreach ($tables as $table) {
            $foreignKey = $table === 'badan_hukum'
                ? 'badanHukumId'
                : ($table === 'non_badan_hukum' ? 'nonBadanHukumId' : 'ppatId');
            $counts = DB::table($table)->selectRaw(
                "COUNT(*) total,
                SUM(status='PENDING') pending,
                SUM(status IN ('PROSES','REVISI','REVISI_PROSES','VERIFIKASI')) processing,
                SUM(status='SELESAI') completed"
            )->first();
            foreach ($stats as $key => $value) {
                $stats[$key] += (int) ($counts->{$key} ?? 0);
            }
            $overdueCount += DB::table($table)
                ->whereNotNull('deadline')
                ->whereDate('deadline', '<', today())
                ->whereNotIn('status', ['SELESAI', 'CANCELLED'])
                ->count();
            $feeIncompleteCount += DB::table($table.' as jobs')
                ->where('jobs.status', '<>', 'CANCELLED')
                ->where(function ($query) use ($foreignKey) {
                    $query->whereNotExists(fn ($subquery) => $subquery
                        ->selectRaw('1')
                        ->from('job_employee_task as all_tasks')
                        ->whereColumn("all_tasks.{$foreignKey}", 'jobs.id'))
                        ->orWhereExists(fn ($subquery) => $subquery
                            ->selectRaw('1')
                            ->from('job_employee_task as empty_fee_tasks')
                            ->whereColumn("empty_fee_tasks.{$foreignKey}", 'jobs.id')
                            ->where('empty_fee_tasks.fee', '<=', 0));
                })
                ->count();

            foreach (DB::table($table)->where('createdAt', '>=', now()->subMonths(5)->startOfMonth())->select('createdAt', 'updatedAt', 'status')->get() as $job) {
                $createdKey = substr((string) $job->createdAt, 0, 7);
                if ($months->has($createdKey)) {
                    $row = $months->get($createdKey);
                    $row['incoming']++;
                    $months->put($createdKey, $row);
                }
                $completedKey = substr((string) $job->updatedAt, 0, 7);
                if ($job->status === 'SELESAI' && $months->has($completedKey)) {
                    $row = $months->get($completedKey);
                    $row['completed']++;
                    $months->put($completedKey, $row);
                }
            }
        }

        $categories = [
            'badan_hukum' => 'Badan Hukum/Usaha',
            'non_badan_hukum' => 'Non Badan Hukum',
            'ppat' => 'PPAT',
        ];
        $deadlineParts = collect($categories)->map(fn ($category, $table) => DB::table($table.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->select(['j.id', 'j.trackingCode', 'j.title', 'j.priority', 'j.deadline', 'j.status', 'c.name as clientName'])
            ->selectRaw('? as category, ? as jobType', [$category, $table])
            ->whereNotNull('j.deadline')->whereNotIn('j.status', ['SELESAI', 'CANCELLED'])
            ->whereBetween('j.deadline', [today(), now()->addDays(7)->endOfDay()]));
        $deadlines = $deadlineParts->shift();
        foreach ($deadlineParts as $part) {
            $deadlines->unionAll($part);
        }

        $overdueParts = collect($categories)->map(fn ($category, $table) => DB::table($table.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->select(['j.id', 'j.trackingCode', 'j.title', 'j.priority', 'j.deadline', 'j.status', 'c.name as clientName'])
            ->selectRaw('? as category, ? as jobType', [$category, $table])
            ->whereNotNull('j.deadline')->whereNotIn('j.status', ['SELESAI', 'CANCELLED'])
            ->whereDate('j.deadline', '<', today()));
        $overdueJobs = $overdueParts->shift();
        foreach ($overdueParts as $part) {
            $overdueJobs->unionAll($part);
        }

        $recentParts = collect($categories)->map(fn ($category, $table) => DB::table($table.' as j')
            ->leftJoin('client as c', 'c.id', '=', 'j.clientId')
            ->select(['j.id', 'j.trackingCode', 'j.title', 'j.status', 'j.createdAt', 'c.name as clientName'])
            ->selectRaw('? as category, ? as jobType', [$category, $table]));
        $recentJobs = $recentParts->shift();
        foreach ($recentParts as $part) {
            $recentJobs->unionAll($part);
        }

        $user = $request->session()->get('auth_user', []);
        $canViewFinance = in_array($user['role'] ?? '', ['ADMINISTRATOR', 'PIMPINAN'], true);
        $staffLanding = in_array($user['role'] ?? '', ['STAFFADMIN', 'OB'], true)
            && $request->query('view') !== 'overview';
        $todayAttendance = null;
        if ($staffLanding) {
            $staffId = DB::table('staff')->where('userId', $user['id'] ?? '')->value('id');
            if ($staffId) {
                $todayAttendance = DB::table('attendance')->where('staffId', $staffId)->whereDate('date', today())->first();
            }
        }

        $attendanceToday = [
            'present' => DB::table('attendance')->whereDate('date', today())->whereNotNull('checkIn')->count(),
            'late' => DB::table('attendance')->whereDate('date', today())->whereTime('checkIn', '>', '08:00:00')->count(),
            'notCheckedOut' => DB::table('attendance')->whereDate('date', today())->whereNotNull('checkIn')->whereNull('checkOut')->count(),
            'totalStaff' => DB::table('staff')->count(),
        ];

        $invoiceSummary = null;
        $recentPayments = collect();
        if ($canViewFinance) {
            $openInvoices = DB::table('invoice as i')
                ->leftJoin('financerecord as payment', function ($join) {
                    $join->on('payment.invoiceId', '=', 'i.id')->where('payment.type', 'INCOME');
                })
                ->where('i.status', '<>', 'Lunas')
                ->select('i.id', 'i.dueDate')
                ->selectRaw('GREATEST(i.amount - COALESCE(SUM(payment.amount), 0), 0) as remainingAmount')
                ->groupBy('i.id', 'i.amount', 'i.dueDate')
                ->get();
            $invoiceSummary = [
                'outstandingCount' => $openInvoices->where('remainingAmount', '>', 0)->count(),
                'outstandingAmount' => (float) $openInvoices->sum('remainingAmount'),
                'overdueCount' => $openInvoices
                    ->filter(fn ($invoice) => $invoice->remainingAmount > 0 && $invoice->dueDate && $invoice->dueDate < today()->toDateString())
                    ->count(),
                'paidThisMonth' => (float) DB::table('financerecord')
                    ->where('type', 'INCOME')
                    ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('amount'),
            ];
            $recentPayments = DB::table('financerecord as payment')
                ->leftJoin('invoice as invoice', 'invoice.id', '=', 'payment.invoiceId')
                ->where('payment.type', 'INCOME')
                ->select('payment.id', 'payment.amount', 'payment.date', 'payment.description', 'invoice.id as invoiceId', 'invoice.invoiceNumber')
                ->orderByDesc('payment.date')
                ->limit(5)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'deadlines' => $deadlines->orderBy('deadline')->limit(8)->get(),
            'overdueJobs' => $overdueJobs->orderBy('deadline')->limit(6)->get(),
            'recentJobs' => $recentJobs->orderByDesc('createdAt')->limit(6)->get(),
            'alerts' => [
                'overdueJobs' => $overdueCount,
                'incompleteFees' => $feeIncompleteCount,
            ],
            'clientCount' => DB::table('client')->count(),
            'staffCount' => DB::table('user')->where('isActive', true)->count(),
            'months' => $months->values(),
            'attendanceToday' => $attendanceToday,
            'canViewFinance' => $canViewFinance,
            'invoiceSummary' => $invoiceSummary,
            'recentPayments' => $recentPayments,
            'staffLanding' => $staffLanding,
            'todayAttendance' => $todayAttendance,
            'user' => $user,
        ]);
    }
}
